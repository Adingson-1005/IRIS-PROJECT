from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from services.inverted_index import search_index
from sqlalchemy import text

router = APIRouter()

@router.get("/")
def search(
    keyword: str = Query(...),
    category: str = Query(None),
    year: int = Query(None),
    methodology: str = Query(None),
    db: Session = Depends(get_db)
):
    try:
        results = search_index(keyword, db)

        if category:
            results = [r for r in results if r["category"] == category]
        if year:
            results = [r for r in results if r["year"] == year]
        if methodology:
            results = [
                r for r in results
                if r["methodology"] == methodology
            ]

        db.execute(text("""
            INSERT INTO search_logs (keyword, results_count)
            VALUES (:keyword, :count)
        """), {"keyword": keyword, "count": len(results)})
        db.commit()

        return {"results": results, "count": len(results)}
    except Exception as e:
        return {"error": str(e)}