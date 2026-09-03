import fitz
import os
import re
import httpx
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def extract_text_from_url(file_url: str) -> str:
    try:
        response = httpx.get(file_url, timeout=30)
        pdf_bytes = response.content
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return ""

def extract_text_from_path(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return ""

def extract_text(source: str) -> str:
    if source.startswith("http"):
        return extract_text_from_url(source)
    return extract_text_from_path(source)

def extract_relevant_content(text: str, max_chars: int = 20000) -> str:
    """Skip front matter (title page, approval sheet, abstract, acknowledgement,
    dedication, table of contents, etc.) by starting from 'Chapter 1' if found,
    since front matter alone can easily exceed a naive character limit and
    cause the AI to only see the front matter instead of the actual paper."""
    match = re.search(r'chapter\s*1\b', text, re.IGNORECASE)
    if match:
        text = text[match.start():]
    return text[:max_chars]


def check_research(student_path: str, template_path: str) -> dict:
    student_text = extract_text(student_path)
    template_text = extract_text(template_path)

    if not student_text:
        return {
            "score": 0,
            "feedback": "Could not extract text from your submitted PDF. Make sure it is not a scanned image."
        }

    if not template_text:
        return {
            "score": 0,
            "feedback": "Could not extract text from the research template. Please contact your instructor."
        }

    student_preview = extract_relevant_content(student_text)
    template_preview = extract_relevant_content(template_text)

    prompt = f"""You are a strict academic research evaluator for senior high school students in the Philippines.

You are given:
1. A RESEARCH TEMPLATE — the standard format and structure that students must follow.
2. A STUDENT SUBMISSION — a document submitted by a student.

---

RESEARCH TEMPLATE:
{template_preview}

---

STUDENT SUBMISSION:
{student_preview}

---

STEP 1 — DOCUMENT VALIDATION:
First, determine if the student submission is actually a research paper or research draft.
If it is NOT a research paper, give SCORE: 0 and explain. Do not evaluate sections.

STEP 2 — SECTION-BY-SECTION EVALUATION:
If it IS a research paper, evaluate each of these sections individually:
- Title Page
- Abstract
- Introduction / Background of the Study
- Statement of the Problem
- Objectives
- Significance of the Study
- Scope and Limitations
- Review of Related Literature
- Methodology
- Results and Discussion
- Conclusion and Recommendations
- References / Bibliography

For each section give:
- STATUS: Present / Partial / Missing
- COMMENT: One sentence about the quality or what is missing

STEP 3 — OVERALL SCORE:
Give an overall accuracy score from 0 to 100 based on how many sections are present and complete.
- 0–30: Very incomplete or not a research paper
- 31–60: Many sections missing
- 61–80: Mostly complete with some gaps
- 81–99: Very complete with minor issues
- 100: Perfectly follows the template

---

Respond ONLY in this exact format:

SCORE: [number 0-100]

DOCUMENT TYPE: [Research Paper / Not a Research Paper]

SECTION BREAKDOWN:
- Title Page: [Present/Partial/Missing] — [one sentence comment]
- Abstract: [Present/Partial/Missing] — [one sentence comment]
- Introduction: [Present/Partial/Missing] — [one sentence comment]
- Statement of the Problem: [Present/Partial/Missing] — [one sentence comment]
- Objectives: [Present/Partial/Missing] — [one sentence comment]
- Significance of the Study: [Present/Partial/Missing] — [one sentence comment]
- Scope and Limitations: [Present/Partial/Missing] — [one sentence comment]
- Review of Related Literature: [Present/Partial/Missing] — [one sentence comment]
- Methodology: [Present/Partial/Missing] — [one sentence comment]
- Results and Discussion: [Present/Partial/Missing] — [one sentence comment]
- Conclusion and Recommendations: [Present/Partial/Missing] — [one sentence comment]
- References: [Present/Partial/Missing] — [one sentence comment]

STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]

TO IMPROVE:
- [area 1 or "None - paper fully follows the template" if score is 100]
- [area 2]
- [area 3]

OVERALL FEEDBACK:
[2-3 sentence summary of the paper's overall quality and main recommendation]
"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": """You are a strict academic research evaluator for senior high school students 
in the Philippines. You must first validate whether the submitted document is actually a research paper 
before evaluating it. If it is not a research paper, give a score of 0 and explain clearly. 
Never give a high score to a document that is not a research paper. Always respond in the exact format requested.
When listing areas to improve, organize them by chapter. Only include chapters that actually need improvement.
If a chapter is already well-written and complete, skip it entirely. Do not force improvements on perfect chapters."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=2000
        )

        raw = response.choices[0].message.content.strip()

        score = 0
        feedback = raw

        score_match = re.search(r'(?i)score\s*:?\s*\**\s*(\d{1,3})', raw)
        if score_match:
            score = max(0, min(100, int(score_match.group(1))))

        return {
            "score": score,
            "feedback": feedback
        }

    except Exception as e:
        return {
            "score": 0,
            "feedback": f"AI evaluation failed: {str(e)}"
        }