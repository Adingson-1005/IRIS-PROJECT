from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    try:
        users = db.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
            FROM users
        """)).fetchone()

        papers = db.execute(text("""
            SELECT COUNT(*) as total FROM papers
        """)).fetchone()

        searches = db.execute(text("""
            SELECT COUNT(*) as total FROM search_logs
            WHERE keyword NOT LIKE 'DOWNLOAD:%'
        """)).fetchone()

        downloads = db.execute(text("""
            SELECT COALESCE(SUM(downloads), 0) as total FROM papers
        """)).fetchone()

        return {
            "users": {
                "total": users.total,
                "students": users.students,
                "instructors": users.instructors,
                "admins": users.admins
            },
            "papers": papers.total,
            "searches": searches.total,
            "downloads": downloads.total
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/top-searches")
def get_top_searches(db: Session = Depends(get_db)):
    try:
        results = db.execute(text("""
            SELECT keyword, COUNT(*) as count
            FROM search_logs
            WHERE keyword NOT LIKE 'DOWNLOAD:%'
            GROUP BY keyword
            ORDER BY count DESC
            LIMIT 10
        """)).fetchall()
        return {"top_searches": [dict(row._mapping) for row in results]}
    except Exception as e:
        return {"error": str(e)}

@router.get("/top-downloads")
def get_top_downloads(db: Session = Depends(get_db)):
    try:
        results = db.execute(text("""
            SELECT title, authors, category,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            ORDER BY downloads DESC
            LIMIT 5
        """)).fetchall()
        return {"top_downloads": [dict(row._mapping) for row in results]}
    except Exception as e:
        return {"error": str(e)}

@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    try:
        results = db.execute(text("""
            SELECT category, COUNT(*) as count
            FROM papers
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        """)).fetchall()
        return {"categories": [dict(row._mapping) for row in results]}
    except Exception as e:
        return {"error": str(e)}