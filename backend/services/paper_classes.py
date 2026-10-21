import re

from sqlalchemy import text
from sqlalchemy.orm import Session


CLASS_ORDER = ("class a", "class b", "class c", "class d")


def _name_tokens(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", value.casefold())


def _name_matches(author_name: str, authors: str) -> bool:
    name_tokens = _name_tokens(author_name)
    author_tokens = _name_tokens(authors)
    if len(name_tokens) < 2 or len(author_tokens) < len(name_tokens):
        return False

    name_orders = [
        name_tokens[index:] + name_tokens[:index]
        for index in range(len(name_tokens))
    ]
    return any(
        author_tokens[index:index + len(name_order)] == name_order
        for name_order in name_orders
        for index in range(len(author_tokens) - len(name_order) + 1)
    )


def attach_student_classes(db: Session, papers: list[dict]) -> list[dict]:
    students = db.execute(text("""
        SELECT full_name, class_name
        FROM users
        WHERE role = 'student'
          AND class_name IS NOT NULL
          AND TRIM(class_name) != ''
    """)).fetchall()

    class_by_author = [
        (student.full_name.strip(), student.class_name.strip())
        for student in students
        if student.full_name and student.full_name.strip()
    ]

    for paper in papers:
        matched_classes = {
            class_name
            for author_name, class_name in class_by_author
            if _name_matches(author_name, paper.get("authors") or "")
        }
        paper["class_names"] = sorted(
            matched_classes,
            key=lambda class_name: (
                CLASS_ORDER.index(class_name.casefold())
                if class_name.casefold() in CLASS_ORDER
                else len(CLASS_ORDER),
                class_name.casefold()
            )
        )

    return papers
