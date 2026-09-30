import fitz
import os
import re
import httpx
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


def extract_text(source: str) -> str:
    try:
        if source.startswith("http"):
            response = httpx.get(source, timeout=30)
            doc = fitz.open(stream=response.content, filetype="pdf")
        else:
            doc = fitz.open(source)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return ""


def extract_relevant_content(text: str, max_chars: int = 300000) -> str:
    """Return the paper starting from 'Chapter 1' if found, skipping the
    front matter (title page, approval sheet, abstract, acknowledgement,
    dedication, table of contents, etc.) which adds no evaluative value.
    max_chars is now very generous (300,000 chars ≈ 75,000 tokens) because
    Gemini's 1,048,576-token context window comfortably fits an entire
    thesis in one request — this is no longer constrained by Groq's old
    8,000 tokens-per-minute limit, so the whole paper can be evaluated
    instead of an early excerpt."""
    match = re.search(r'chapter\s*1\b', text, re.IGNORECASE)
    if match:
        text = text[match.start():]
    return text[:max_chars]


def check_research(student_path: str, template_path: str) -> dict:
    student_text = extract_text(student_path)
    template_text = extract_text(template_path)

    if not student_text:
        return {"score": 0, "feedback": "Could not extract text from your draft. Please make sure it is a valid PDF."}

    if not template_text:
        return {"score": 0, "feedback": "Could not extract text from the research template. Please contact your instructor."}

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

IMPORTANT RULE FOR SCORING:
- If you give a score of 100, the TO IMPROVE section must say "None - this paper fully follows the template"
- If you give a score above 80, the TO IMPROVE section should only list very minor suggestions

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
- [area 1 or "None - this paper fully follows the template" if score is 100]
- [area 2]
- [area 3]

OVERALL FEEDBACK:
[2-3 sentence summary]
"""

    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a strict academic research evaluator for senior high school students in the Philippines.",
                temperature=0.2,
                max_output_tokens=3000
            )
        )

        feedback = (response.text or "").strip()
        if not feedback:
            return {"score": 0, "feedback": "AI evaluation failed: empty response from the model. Please try again."}

        score_match = re.search(r"(?i)score\s*:?\s*\**\s*(\d{1,3})", feedback)
        score = int(score_match.group(1)) if score_match else 0
        score = max(0, min(100, score))

        return {"score": score, "feedback": feedback}

    except Exception as e:
        return {"score": 0, "feedback": f"AI evaluation failed: {str(e)}"}