from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

REJECTED_KEYWORDS = [
    "make me", "write me", "draft me", "create me", "generate me",
    "write a paper", "make a paper", "draft a paper", "create a paper",
    "write my", "do my", "finish my", "complete my",
    "write an essay", "make an essay", "write a thesis",
    "write a research", "make a research", "draft a research",
    "write for me", "do this for me", "make this for me"
]

SYSTEM_PROMPT = """You are a research guidance assistant for IRIS, an institutional research repository for St. Joseph College Olongapo.
You help senior high school students understand research concepts, methodologies, and academic topics.
You can answer general research questions using your knowledge, and also reference papers from the repository when relevant.
You must NEVER write papers, essays, drafts, or complete any research task for students.
If asked to write or create content, always decline politely."""


def search_relevant_papers(question: str, db: Session, limit: int = 3):
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
        'be', 'been', 'have', 'has', 'do', 'does', 'did', 'this', 'that',
        'it', 'as', 'what', 'how', 'why', 'when', 'where', 'who', 'which'
    }

    keywords = [
        w for w in question.lower().split()
        if w not in stop_words and len(w) > 2
    ]

    if not keywords:
        return []

    paper_scores = {}
    paper_info = {}

    for keyword in keywords:
        results = db.execute(text("""
            SELECT ii.paper_id, ii.frequency, p.title, p.authors, p.abstract
            FROM inverted_index ii
            JOIN papers p ON ii.paper_id = p.id
            WHERE ii.term = :term
        """), {"term": keyword}).fetchall()

        for row in results:
            pid = str(row.paper_id)
            paper_scores[pid] = paper_scores.get(pid, 0) + row.frequency
            paper_info[pid] = {
                "title": row.title,
                "authors": row.authors,
                "abstract": row.abstract or ""
            }

    sorted_papers = sorted(paper_scores.items(), key=lambda x: x[1], reverse=True)

    return [
        {
            "paper_id": pid,
            "score": score,
            "title": paper_info[pid]["title"],
            "authors": paper_info[pid]["authors"],
            "abstract": paper_info[pid]["abstract"]
        }
        for pid, score in sorted_papers[:limit]
    ]


def build_context(relevant_papers: list) -> str:
    if not relevant_papers:
        return "No directly relevant papers found in the repository for this question."

    context = ""
    for i, paper in enumerate(relevant_papers):
        context += f"\nPaper {i + 1}: {paper['title']}\n"
        context += f"Authors: {paper['authors']}\n"
        context += f"Abstract: {paper['abstract'][:1000]}\n"
        context += "---\n"
    return context


def build_prompt(question: str, context: str) -> str:
    return f"""You are a research guidance assistant for senior high school students in the Philippines.
You help students understand research concepts, methodologies, and academic topics.

REPOSITORY PAPERS (use these as references when relevant):
{context}

STUDENT QUESTION:
{question}

INSTRUCTIONS:
- Answer research-related questions using your general knowledge about research and academics
- If the repository papers above are relevant to the question, incorporate them and cite the paper titles
- If no papers are relevant, answer from your general knowledge about research
- Keep your answer clear and helpful — 3 to 5 sentences maximum
- Do not write, draft, or create research papers or documents for the student"""


@router.post("/ask")
def ask_rag(payload: dict, db: Session = Depends(get_db)):
    question = payload.get("question", "").strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    question_lower = question.lower()
    for keyword in REJECTED_KEYWORDS:
        if keyword in question_lower:
            return {
                "answer": "I'm sorry, but I'm only able to assist with research-related questions. I cannot write, draft, or create research papers or documents for you. Please ask me a question about research topics, concepts, or methodologies instead.",
                "sources": []
            }

    relevant_papers = search_relevant_papers(question, db)
    context = build_context(relevant_papers)
    prompt = build_prompt(question, context)

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        answer = response.choices[0].message.content.strip()
        sources = [
            {"title": p["title"], "authors": p["authors"]}
            for p in relevant_papers
        ]

        return {"answer": answer, "sources": sources}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")