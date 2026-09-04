import os
import re
import httpx
import fitz
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

MODEL = "llama-3.3-70b-versatile"
MAX_COMPLETION_TOKENS = 700
MAX_STUDENT_CHARS = 3000
MAX_TEMPLATE_CHARS = 1200

SECTION_KEYWORDS = [
    "abstract", "background of the study", "introduction",
    "objectives of the study", "statement of the problem",
    "significance of the study", "scope and limitation",
    "scope and limitations", "review of related literature",
    "theoretical and conceptual framework", "research design",
    "research methodology", "methodology", "data collection",
    "statistical treatment", "presentation, analysis and interpretation",
    "results and discussion", "summary of findings", "conclusion",
    "recommendation", "references",
]


def extract_text(source: str) -> str:
    try:
        if source.startswith(("http://", "https://")):
            response = httpx.get(source, timeout=30, follow_redirects=True)
            response.raise_for_status()
            document = fitz.open(stream=response.content, filetype="pdf")
        else:
            document = fitz.open(source)

        try:
            return "\n".join(page.get_text("text") for page in document).strip()
        finally:
            document.close()
    except Exception as exc:
        raise RuntimeError(f"PDF text extraction failed: {exc}") from exc


def _normalise(line: str) -> str:
    return re.sub(r"\s+", " ", line.lower()).strip(" .:-\t")


def _is_heading(line: str) -> bool:
    normalised = _normalise(line)
    return any(keyword in normalised for keyword in SECTION_KEYWORDS)


def _best_section_snippet(lines: list, keyword: str, snippet_len: int):
    candidates = []
    for index, line in enumerate(lines):
        if keyword not in _normalise(line):
            continue

        following = []
        for next_line in lines[index + 1:index + 28]:
            if _is_heading(next_line) and following:
                break
            following.append(next_line)
        body = " ".join(following).strip()
        words = re.findall(r"[A-Za-z]{3,}", body)
        sentence_marks = len(re.findall(r"[.!?]", body))
        score = len(words) + sentence_marks * 8 - sum(_is_heading(x) for x in following) * 20
        candidates.append((score, index, body))

    if not candidates:
        return None
    _, _, body = max(candidates, key=lambda candidate: candidate[0])
    return body[:snippet_len]


def extract_relevant_content(text: str, max_chars: int, snippet_len: int = 180) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    snippets = []
    seen = set()

    front_matter = " ".join(lines[:10])[:250]
    if front_matter:
        snippets.append(f"[FRONT MATTER] {front_matter}")

    for keyword in SECTION_KEYWORDS:
        canonical = keyword.replace("limitations", "limitation")
        if canonical in seen:
            continue
        seen.add(canonical)
        body = _best_section_snippet(lines, keyword, snippet_len)
        if body:
            snippets.append(f"[{keyword.upper()}] {body}")

    return "\n".join(snippets)[:max_chars]


def check_research(student_path: str, template_path: str) -> dict:
    try:
        student_text = extract_text(student_path)
        template_text = extract_text(template_path)
    except RuntimeError as exc:
        return {"score": 0, "feedback": str(exc)}

    if not student_text:
        return {
            "score": 0,
            "feedback": "No selectable text was found in the submitted PDF. If it is scanned, run OCR first."
        }
    if not template_text:
        return {
            "score": 0,
            "feedback": "Could not extract text from the research template. Please contact your instructor."
        }

    student_preview = extract_relevant_content(student_text, MAX_STUDENT_CHARS)
    template_preview = extract_relevant_content(template_text, MAX_TEMPLATE_CHARS, 100)

    prompt = f"""You evaluate senior-high-school research papers in the Philippines.

The TEMPLATE shows the required structure. The SUBMISSION is a compact extraction of
the student's PDF. Table-of-contents entries are NOT evidence that a section has content.
Judge only the prose shown under each section heading.

IMPORTANT RULES:
- A document that follows the template structure but has incomplete content is a "Research Paper Draft"
- Only use "Not a Research Paper" if it has absolutely no recognizable research structure
- If a section heading is present but has no content below it, mark it as Missing
- If a section has some content but is incomplete, mark it as Partial
- If a section is fully written, mark it as Present
- A score of 100 means all sections are Present and complete

TEMPLATE:
{template_preview}

SUBMISSION:
{student_preview}

Respond exactly in this format:

SCORE: [0-100]

DOCUMENT TYPE: [Research Paper / Research Paper Draft / Not a Research Paper]

SECTION BREAKDOWN:
- Title Page: [Present/Partial/Missing] — [one sentence]
- Abstract: [Present/Partial/Missing] — [one sentence]
- Introduction: [Present/Partial/Missing] — [one sentence]
- Statement of the Problem: [Present/Partial/Missing] — [one sentence]
- Objectives: [Present/Partial/Missing] — [one sentence]
- Significance of the Study: [Present/Partial/Missing] — [one sentence]
- Scope and Limitations: [Present/Partial/Missing] — [one sentence]
- Review of Related Literature: [Present/Partial/Missing] — [one sentence]
- Methodology: [Present/Partial/Missing] — [one sentence]
- Results and Discussion: [Present/Partial/Missing] — [one sentence]
- Conclusion and Recommendations: [Present/Partial/Missing] — [one sentence]
- References: [Present/Partial/Missing] — [one sentence]

STRENGTHS:
- [up to three evidence-based strengths, or "None identified" if score is very low]

TO IMPROVE:
- [up to three highest-priority improvements, or "None - paper fully follows the template" if score is 100]

OVERALL FEEDBACK:
[Two concise sentences summarizing the paper quality and main recommendation.]"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=MAX_COMPLETION_TOKENS,
        )
        feedback = response.choices[0].message.content.strip()
        match = re.search(r"(?im)^SCORE:\s*(\d{1,3})\b", feedback)
        score = max(0, min(100, int(match.group(1)))) if match else 0
        return {"score": score, "feedback": feedback}
    except Exception as exc:
        return {"score": 0, "feedback": f"AI evaluation failed: {exc}"}