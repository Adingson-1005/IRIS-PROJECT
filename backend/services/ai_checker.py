import fitz
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

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
You are a strict academic research evaluator for senior high school students in the Philippines.

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
A valid research paper or draft must contain at least some of these elements:
- A title related to a research topic
- An abstract or introduction
- A research problem or objectives
- Methodology or methods section
- References or bibliography
- Academic writing style

If the submission is NOT a research paper (for example: a quiz, exam, questionnaire, list of questions, 
story, poem, personal letter, or any non-academic document), you must:
- Give a SCORE of 0
- Clearly state it is not a valid research paper submission
- Do not provide strengths or suggestions as if it were a research paper

STEP 2 — EVALUATION (only if it is a valid research paper):
If it IS a research paper or draft, compare it against the template and evaluate:
- Check if the required sections are present and properly written
- Give an accuracy/completeness score from 0 to 100 based on how well it follows the template
- A score of 0-30 means very incomplete or poor quality
- A score of 31-60 means partial completion with major sections missing
- A score of 61-80 means mostly complete with some sections needing improvement
- A score of 81-100 means very complete and closely follows the template

Be STRICT and ACCURATE with scoring. Do not give high scores to incomplete drafts.

---

Respond ONLY in this exact format, no extra text:

SCORE: [number from 0 to 100]

DOCUMENT TYPE: [Research Paper / Not a Research Paper]

STRENGTHS:
- [strength 1 or "N/A - Not a valid research paper submission"]
- [strength 2]
- [strength 3]

MISSING OR INCOMPLETE:
- [issue 1 or "N/A - Not a valid research paper submission"]
- [issue 2]
- [issue 3]

SUGGESTIONS:
- [suggestion 1 or "Please submit an actual research paper or draft"]
- [suggestion 2]
- [suggestion 3]

OVERALL FEEDBACK:
[2-3 sentence summary. If not a research paper, clearly state what was submitted and that the student must submit an actual research paper or draft.]
"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a strict academic research evaluator for senior high school students 
in the Philippines. You must first validate whether the submitted document is actually a research paper 
before evaluating it. If it is not a research paper, give a score of 0 and explain clearly. 
Never give a high score to a document that is not a research paper. Always respond in the exact format requested."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1500
        )

        raw = response.choices[0].message.content.strip()

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