from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

def search_relevant_papers(question: str, db: Session, limit: int = 3):
    words = question.lower().split()
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
        'be', 'been', 'have', 'has', 'do', 'does', 'did', 'this', 'that',
        'it', 'as', 'what', 'how', 'why', 'when', 'where', 'who', 'which'
    }
    keywords = [w for w in words if w not in stop_words and len(w) > 2]

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
    top_papers = sorted_papers[:limit]

    return [
        {
            "paper_id": pid,
            "score": score,
            "title": paper_info[pid]["title"],
            "authors": paper_info[pid]["authors"],
            "abstract": paper_info[pid]["abstract"]
        }
        for pid, score in top_papers
    ]

@router.post("/ask")
def ask_rag(payload: dict, db: Session = Depends(get_db)):
    question = payload.get("question", "").strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Check if the question is trying to make the AI do something it shouldn't
    rejected_keywords = [
        "make me", "write me", "draft me", "create me", "generate me",
        "write a paper", "make a paper", "draft a paper", "create a paper",
        "write my", "do my", "finish my", "complete my",
        "write an essay", "make an essay", "write a thesis",
        "write a research", "make a research", "draft a research",
        "write for me", "do this for me", "make this for me"
    ]

    question_lower = question.lower()
    for keyword in rejected_keywords:
        if keyword in question_lower:
            return {
                "answer": "I'm sorry, but I'm only able to assist with research-related questions based on the papers in the IRIS repository. I cannot write, draft, or create research papers or documents for you. Please ask me a question about research topics, methodologies, or findings from the repository instead.",
                "sources": []
            }

    relevant_papers = search_relevant_papers(question, db)

    if not relevant_papers:
        return {
            "answer": "I could not find any relevant research papers in the repository to answer your question. Try asking about topics covered in the uploaded papers.",
            "sources": []
        }

    context = ""
    for i, paper in enumerate(relevant_papers):
        context += f"\nPaper {i+1}: {paper['title']}\n"
        context += f"Authors: {paper['authors']}\n"
        context += f"Abstract: {paper['abstract'][:1000]}\n"
        context += "---\n"

    prompt = f"""You are a research guidance assistant for senior high school students in the Philippines.
Your ONLY purpose is to answer research-related questions based on the papers in the IRIS repository.
You must NEVER write, draft, create, or generate research papers, essays, or any documents for users.
If a user asks you to write or create something, politely decline and redirect them to ask a question instead.
Answer questions based ONLY on the research papers provided below.
Do not use any outside knowledge.

RESEARCH PAPERS FROM THE REPOSITORY:
{context}

STUDENT QUESTION:
{question}

Provide a clear, helpful answer based only on the papers above.
Keep your answer concise — 3 to 5 sentences maximum.
If the question asks you to write or create something, decline politely."""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a research guidance assistant for IRIS — an institutional research repository. 
Your sole purpose is to answer research questions based on papers in the repository.
You must NEVER write papers, essays, drafts, or any documents for users.
If asked to write or create content, always decline politely and ask them to rephrase as a research question.
Always respond based only on provided paper content."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=500
        )

        answer = response.choices[0].message.content.strip()

        sources = [
            {"title": p["title"], "authors": p["authors"]}
            for p in relevant_papers
        ]

        return {
            "answer": answer,
            "sources": sources
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")