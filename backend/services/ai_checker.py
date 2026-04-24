import google.generativeai as genai
import fitz
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def extract_text(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return ""

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

    student_preview = student_text[:4000]
    template_preview = template_text[:4000]

    prompt = f"""
You are an academic research evaluator for senior high school students in the Philippines.

You are given:
1. A RESEARCH TEMPLATE — the standard format and structure that students must follow.
2. A STUDENT DRAFT — a research paper submitted by a student.

Your job is to:
- Compare the student draft against the template
- Check if the required sections are present and properly written
- Give an accuracy/completeness score from 0 to 100
- Provide specific, constructive suggestions for improvement

---

RESEARCH TEMPLATE:
{template_preview}

---

STUDENT DRAFT:
{student_preview}

---

Respond ONLY in this exact format, no extra text:

SCORE: [number from 0 to 100]

STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]

MISSING OR INCOMPLETE:
- [issue 1]
- [issue 2]
- [issue 3]

SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]

OVERALL FEEDBACK:
[2-3 sentence summary of the student's draft quality and what to prioritize improving]
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()

        score = 0
        feedback = raw

        for line in raw.split('\n'):
            if line.startswith("SCORE:"):
                try:
                    score = int(line.replace("SCORE:", "").strip())
                except:
                    score = 0
                break

        return {
            "score": score,
            "feedback": feedback
        }

    except Exception as e:
        return {
            "score": 0,
            "feedback": f"AI evaluation failed: {str(e)}"
        }