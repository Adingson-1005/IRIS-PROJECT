import fitz
import re
from sqlalchemy.orm import Session
from sqlalchemy import text

def extract_text_from_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        return full_text.lower()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def tokenize(text: str):
    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on",
        "at", "to", "for", "of", "with", "by", "from",
        "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "this",
        "that", "these", "those", "it", "its", "as", "into"
    }
    words = re.findall(r'[a-z]+', text)
    return [w for w in words if w not in stop_words and len(w) > 2]

def build_index(paper_id: str, file_path: str, db: Session):
    try:
        extracted_text = extract_text_from_pdf(file_path)
        if not extracted_text:
            print(f"No text extracted from {file_path}")
            return

        tokens = tokenize(extracted_text)

        term_data = {}
        for position, term in enumerate(tokens):
            if term not in term_data:
                term_data[term] = {"frequency": 0, "positions": []}
            term_data[term]["frequency"] += 1
            term_data[term]["positions"].append(position)

        db.execute(
            text("DELETE FROM inverted_index WHERE paper_id = :paper_id"),
            {"paper_id": paper_id}
        )

        for term, data in term_data.items():
            db.execute(text("""
                INSERT INTO inverted_index (term, paper_id, frequency, positions)
                VALUES (:term, :paper_id, :frequency, :positions)
            """), {
                "term": term,
                "paper_id": paper_id,
                "frequency": data["frequency"],
                "positions": data["positions"]
            })

        db.commit()
        print(f"Indexed {len(term_data)} terms for paper {paper_id}")

    except Exception as e:
        print(f"Index build error: {e}")

def search_index(query: str, db: Session):
    try:
        tokens = tokenize(query.lower())
        if not tokens:
            return []

        paper_scores = {}

        for term in tokens:
            results = db.execute(text("""
                SELECT ii.paper_id, ii.frequency,
                       p.title, p.authors, p.category,
                       p.methodology, p.year, p.abstract
                FROM inverted_index ii
                JOIN papers p ON ii.paper_id = p.id
                WHERE ii.term = :term
            """), {"term": term}).fetchall()

            for row in results:
                pid = str(row.paper_id)
                if pid not in paper_scores:
                    paper_scores[pid] = {
                        "paper_id": pid,
                        "title": row.title,
                        "authors": row.authors,
                        "category": row.category,
                        "methodology": row.methodology,
                        "year": row.year,
                        "abstract": row.abstract,
                        "score": 0
                    }
                paper_scores[pid]["score"] += row.frequency

        ranked = sorted(
            paper_scores.values(),
            key=lambda x: x["score"],
            reverse=True
        )
        return ranked

    except Exception as e:
        print(f"Search error: {e}")
        return []