from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from google import genai
from google.genai import types
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"

# Maximum number of Ask AI questions a student may ask per day.
# Change it here, or set RAG_DAILY_LIMIT in the Render environment variables.
DAILY_QUESTION_LIMIT = int(os.getenv("RAG_DAILY_LIMIT", "5"))

def require_login(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def today_ph():
    """The 'day' for the question limit follows Philippine time (UTC+8),
    so the limit resets at midnight in the Philippines."""
    return datetime.now(timezone(timedelta(hours=8))).date()


def reserve_question(db: Session, student_id: str, usage_date):
    """Atomically uses up one question for today. Returns the new question
    count, or None when the student has already reached the daily limit."""
    if DAILY_QUESTION_LIMIT <= 0:
        return None
    row = db.execute(text("""
        INSERT INTO rag_daily_usage (student_id, usage_date, question_count)
        VALUES (CAST(:sid AS uuid), :d, 1)
        ON CONFLICT (student_id, usage_date)
        DO UPDATE SET question_count = rag_daily_usage.question_count + 1
        WHERE rag_daily_usage.question_count < :limit
        RETURNING question_count
    """), {"sid": str(student_id), "d": usage_date, "limit": DAILY_QUESTION_LIMIT}).fetchone()
    db.commit()
    return row[0] if row else None


def refund_question(db: Session, student_id: str, usage_date):
    """Gives the question back when the AI could not answer, so a server
    error never costs the student one of their daily questions."""
    try:
        db.execute(text("""
            UPDATE rag_daily_usage
            SET question_count = GREATEST(question_count - 1, 0)
            WHERE student_id = CAST(:sid AS uuid) AND usage_date = :d
        """), {"sid": str(student_id), "d": usage_date})
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Could not refund Ask AI question: {e}")


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


@router.get("/usage")
def get_usage(db: Session = Depends(get_db), user=Depends(require_login)):
    """How many Ask AI questions the student has left today."""
    if user.get("role") != "student":
        return {"limit": None, "used": 0, "remaining": None}

    row = db.execute(text("""
        SELECT question_count FROM rag_daily_usage
        WHERE student_id = CAST(:sid AS uuid) AND usage_date = :d
    """), {"sid": str(user.get("sub")), "d": today_ph()}).fetchone()

    used = row[0] if row else 0
    return {
        "limit": DAILY_QUESTION_LIMIT,
        "used": used,
        "remaining": max(DAILY_QUESTION_LIMIT - used, 0)
    }


@router.post("/ask")
def ask_rag(payload: dict, db: Session = Depends(get_db), user=Depends(require_login)):
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

    # Daily limit applies to students only. Rejected / empty questions above
    # do not use one up because they never reach the AI.
    is_student = user.get("role") == "student"
    student_id = user.get("sub")
    usage_date = today_ph()
    new_count = None

    if is_student:
        try:
            new_count = reserve_question(db, student_id, usage_date)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Could not check your daily question limit. Please try again."
            )
        if new_count is None:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Your Ask AI session has expired for the day. "
                    f"You have used all {DAILY_QUESTION_LIMIT} questions for today. "
                    "It resets tomorrow."
                )
            )

    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=500
            )
        )

        answer = (response.text or "").strip()
        if not answer:
            raise HTTPException(status_code=500, detail="AI error: empty response from the model")

        sources = [
            {"title": p["title"], "authors": p["authors"]}
            for p in relevant_papers
        ]

        result = {"answer": answer, "sources": sources}
        if is_student:
            result["usage"] = {
                "limit": DAILY_QUESTION_LIMIT,
                "used": new_count,
                "remaining": max(DAILY_QUESTION_LIMIT - new_count, 0)
            }
        return result

    except HTTPException:
        if is_student:
            refund_question(db, student_id, usage_date)
        raise
    except Exception as e:
        if is_student:
            refund_question(db, student_id, usage_date)
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")