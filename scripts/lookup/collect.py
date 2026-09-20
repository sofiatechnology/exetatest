#!/usr/bin/env python3
"""Collect EXETAT questions from Schoolap URLs and local lookup dumps.

Writes normalized JSON papers to src/database/seeds/lookup/collected/ for seed-lookup-questions.ts.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
SEEDS_DIR = REPO / "src" / "database" / "seeds"
COLLECTED_DIR = SEEDS_DIR / "lookup" / "collected"
SEEDS_SCIENTIFIQUE = SEEDS_DIR / "scientifique"
SECTION_ID = "02"  # SCIENTIFIQUE

FR_STEM = re.compile(
    r"^(indiquez|dans la phrase|le facteur|texte français|la subor|"
    r"ngando|l’écart|l'écart|au sens étymologique|pour l’auteur|pour l'auteur)",
    re.I,
)

QUESTION_OBJ = re.compile(
    r'\{\s*"(?:id|number)"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"(.*?)"\s*,'
    r'\s*"question"\s*:\s*"(.*?)"\s*,\s*"options"\s*:\s*\{(.*?)\}\s*\}',
    re.S,
)
OPTION_PAIR = re.compile(r'"([A-F])"\s*:\s*"(.*?)"', re.S)
TAG_RE = re.compile(r"<[^>]+>")
SESSION_RE = re.compile(r"Session\s*:\s*(\d{4})", re.I)
SUBJECT_RE = re.compile(r"/exetats/\d+/([^/]+)/([^/?#]+)")
QUESTION_BLOCK_RE = re.compile(
    r'<div class="my-3">\s*<h3[^>]*>\s*(question\s+\d+)\s*</h3>(.*?)</ul>\s*</div>',
    re.S | re.I,
)
OPTION_LI_RE = re.compile(
    r'<div class="assertion">\s*([A-F])\s*</div>\s*'
    r'<div class="assertion-content">(.*?)</div>',
    re.S | re.I,
)

# 0-based answer index for the 2018 biologie-physique paper (plasmodium / physics).
SCIENCE_2018_ANSWERS = {
    1: 2,
    2: 3,
    3: 0,
    4: 1,
    5: 3,
    6: 3,
    7: 4,
    8: 1,
    9: 2,
    10: 1,
    11: 4,
    12: 0,
    13: 1,
    14: 2,
    15: 4,
    16: 2,
    17: 1,
    18: 2,
    19: 4,
    20: 3,
}

CG_2016_ANSWERS = {
    2: 0,  # Thysville
    3: 0,  # Cap Bon
    5: 3,  # Périphérique
    6: 2,  # Cours d'eau
    7: 3,  # Conseil européen
    8: 1,  # UNESCO
    10: 2,  # critique de provenance
    14: 4,  # archéologie
    16: 4,  # E et A
    20: 1,  # habitudes motrices
}

CG_2018_ANSWERS = {
    1: 1,  # urne
    2: 3,  # Cour Constitutionnelle
}


def strip_html(value: str) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = TAG_RE.sub(" ", value)
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def clean_option_text(value: str) -> str:
    text = strip_html(value).strip()
    if text.upper() == "ABR":
        return ""
    return text


def options_to_list(options: dict[str, str]) -> list[str]:
    ordered: list[str] = []
    for key in ("A", "B", "C", "D", "E"):
        if key in options:
            text = clean_option_text(options[key])
            if text:
                ordered.append(text)
    return ordered


def is_french_question(question: str) -> bool:
    return bool(FR_STEM.search(question.strip()))


def split_langue_courses(
    questions: list[dict],
    english_passage: str | None = None,
    french_passage: str | None = None,
) -> list[dict]:
    english: list[dict] = []
    french: list[dict] = []
    seen_french = False
    for q in questions:
        text = q["question"]
        if not seen_french and (
            is_french_question(text) or text.upper().startswith("TEXTE FRAN")
        ):
            seen_french = True
        if seen_french:
            french.append(q)
        else:
            english.append(q)

    if not french:
        return [
            {
                "course": "Langues",
                "passage": english_passage,
                "questions": questions,
            }
        ]

    courses = []
    if english:
        courses.append(
            {
                "course": "ANGLAIS",
                "passage": english_passage,
                "questions": english,
            }
        )
    if french:
        courses.append(
            {
                "course": "FRANÇAIS",
                "passage": french_passage,
                "questions": french,
            }
        )
    return courses


def extract_dump_questions(text: str) -> list[dict]:
    questions = []
    for match in QUESTION_OBJ.finditer(text):
        number, _title, question, opts_raw = match.groups()
        options = {
            key: value.replace("\\n", " ").replace('\\"', '"')
            for key, value in OPTION_PAIR.findall(opts_raw)
        }
        questions.append(
            {
                "number": int(number),
                "question": question.replace("\\n", " ").replace('\\"', '"'),
                "options": options,
                "start": match.start(),
            }
        )
    return questions


def group_by_reset(questions: list[dict]) -> list[list[dict]]:
    groups: list[list[dict]] = []
    current: list[dict] = []
    for question in questions:
        if question["number"] == 1 and current:
            groups.append(current)
            current = []
        current.append(question)
    if current:
        groups.append(current)
    return groups


def fingerprint(questions: list[dict]) -> str:
    if not questions:
        return ""
    return re.sub(r"\s+", " ", questions[0]["question"]).strip().lower()[:80]


def apply_answers(questions: list[dict], answer_map: dict[int, int]) -> None:
    for question in questions:
        number = question.get("number")
        if number in answer_map:
            question["answer"] = answer_map[number]


def to_seed_questions(raw_questions: list[dict]) -> list[dict]:
    seeded = []
    for question in raw_questions:
        options = options_to_list(question.get("options") or {})
        text = strip_html(question.get("question") or "")
        if not text or len(options) < 2:
            continue
        answer = question.get("answer", 0)
        if not isinstance(answer, int) or answer < 0 or answer >= len(options):
            answer = 0
        seeded.append(
            {
                "question": text,
                "options": options,
                "answer": answer,
            }
        )
    return seeded


def course_label(item_type: str, subject: str) -> str:
    if item_type == "cg":
        return "Culture générale"
    if item_type == "la":
        return "Langues"
    if item_type == "co":
        return "Cours d'option"
    pretty = subject.replace("-", " ").strip()
    if not pretty or pretty.lower() == "science":
        return "Sciences"
    return pretty[:1].upper() + pretty[1:]


def paper(
    year: int,
    item_type: str,
    course: str,
    questions: list[dict],
    passage: str | None = None,
    source: str = "",
) -> dict | None:
    seeded = to_seed_questions(questions)
    if not seeded:
        return None
    return {
        "section_id": SECTION_ID,
        "year": year,
        "type": item_type,
        "source": source,
        "courses": [
            {
                "course": course,
                "passage": passage,
                "questions": seeded,
            }
        ],
    }


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def scrape_exam(url: str) -> dict | None:
    print(f"  fetching {url}")
    try:
        html_doc = fetch(url)
    except Exception as exc:  # noqa: BLE001
        print(f"  failed: {exc}")
        return None

    session_match = SESSION_RE.search(html_doc)
    year = int(session_match.group(1)) if session_match else None
    subject_match = SUBJECT_RE.search(url)
    branch = subject_match.group(1) if subject_match else "unknown"
    subject = subject_match.group(2) if subject_match else "unknown"

    type_map = {
        "science": "sc",
        "langue": "la",
        "culture-generale": "cg",
        "option": "co",
    }
    item_type = type_map.get(branch, "sc")

    questions = []
    for block in QUESTION_BLOCK_RE.finditer(html_doc):
        title = strip_html(block.group(1))
        body = block.group(2)
        number_match = re.search(r"(\d+)", title)
        number = int(number_match.group(1)) if number_match else len(questions) + 1
        question_html = re.split(r"<ul", body, maxsplit=1, flags=re.I)[0]
        question_text = strip_html(question_html)
        options = {}
        for opt in OPTION_LI_RE.finditer(body):
            options[opt.group(1).upper()] = strip_html(opt.group(2))
        questions.append(
            {
                "number": number,
                "question": question_text,
                "options": options,
            }
        )

    if fingerprint(questions).startswith("un fermier achète"):
        print("  skip: unstructured practical exam (no MCQ options)")
        return None

    if item_type == "sc" and fingerprint(questions).startswith(
        "indiquez le mode de reproduction du plasmodium"
    ):
        apply_answers(questions, SCIENCE_2018_ANSWERS)
        year = year or 2018

    course_name = course_label(item_type, subject)

    if not questions:
        print("  skip: no MCQ questions found")
        return None

    built = paper(
        year or 2015,
        item_type,
        course_name,
        questions,
        source=url,
    )
    if built and item_type == "la":
        courses = split_langue_courses(to_seed_questions(questions))
        built["courses"] = courses
    return built


def load_langue_2015() -> dict | None:
    path = ROOT / "langue" / "langue_complete_data.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    raw = []
    for item in data.get("questions", []):
        raw.append(
            {
                "number": item.get("id") or item.get("number"),
                "question": item.get("question") or "",
                "options": item.get("options") or {},
            }
        )
    if raw and raw[0]["question"].strip().upper() in {"ENGLISH TEXT", ""}:
        raw[0]["question"] = (
            "Indicate the title which best suits the above text."
        )
    passages = data.get("passages") or {}
    english = passages.get("english") or ""
    # Keep only the English passage, not the concatenated French block.
    if "TEXTE FRANÇAIS" in english:
        english = english.split("TEXTE FRANÇAIS")[0]
        english = re.split(r"QUESTION ON TEXT", english)[0].strip()
    french = (
        "La sécurité alimentaire est un élément essentiel pour accroître "
        "le bien – être des pauvres à la campagne en ville."
    )
    if "La sécurité alimentaire" in (passages.get("english") or ""):
        full = passages["english"]
        start = full.find("La sécurité alimentaire")
        end = full.find("QUESTION SUR LE TEXTE")
        if start >= 0:
            french = full[start:end].strip() if end > start else full[start:].strip()

    seeded = to_seed_questions(raw)
    courses = split_langue_courses(seeded, english, french)
    return {
        "section_id": SECTION_ID,
        "year": int(data.get("session") or 2015),
        "type": "la",
        "source": str(path.relative_to(REPO)),
        "courses": courses,
    }


def load_comment_dumps() -> list[dict]:
    papers: list[dict] = []
    seen: set[str] = set()

    mapping = [
        (
            "math-physique-2016.ts",
            0,
            lambda qs: paper(2016, "cg", "Culture générale", qs, source="dump:2016-cg"),
            CG_2016_ANSWERS,
        ),
        (
            "math-physique-2017.ts",
            1,
            lambda qs: _langue_paper(2017, qs, "dump:2017-la"),
            None,
        ),
        (
            "math-physique-2018.ts",
            0,
            lambda qs: paper(2018, "cg", "Culture générale", qs, source="dump:2018-cg"),
            CG_2018_ANSWERS,
        ),
        (
            "math-physique-2018.ts",
            1,
            lambda qs: paper(
                2018, "cg", "Éducation civique", qs, source="dump:2018-cg-civisme"
            ),
            None,
        ),
        (
            "math-physique-2018.ts",
            2,
            lambda qs: _langue_paper(2018, qs, "dump:2018-la"),
            None,
        ),
        (
            "math-physique-2018.ts",
            4,
            lambda qs: paper(
                2018,
                "sc",
                "Biologie physique",
                qs,
                source="dump:2018-sc",
            ),
            SCIENCE_2018_ANSWERS,
        ),
        (
            "math-physique-2019.ts",
            1,
            lambda qs: _langue_paper(2019, qs, "dump:2019-la"),
            None,
        ),
        (
            "math-physique-2022.ts",
            0,
            lambda qs: paper(
                2022, "co", "Économie et gestion", qs, source="dump:2022-co"
            ),
            None,
        ),
    ]

    cache: dict[str, list[list[dict]]] = {}
    for filename, group_index, builder, answers in mapping:
        if filename not in cache:
            text = (SEEDS_SCIENTIFIQUE / filename).read_text(encoding="utf-8")
            cache[filename] = group_by_reset(extract_dump_questions(text))
        groups = cache[filename]
        if group_index >= len(groups):
            continue
        questions = [dict(q) for q in groups[group_index]]
        key = fingerprint(questions)
        if key in seen:
            continue
        if answers:
            apply_answers(questions, answers)
        built = builder(questions)
        if not built:
            continue
        seen.add(key)
        papers.append(built)

    return papers


def _langue_paper(year: int, questions: list[dict], source: str) -> dict | None:
    seeded = to_seed_questions(questions)
    if not seeded:
        return None
    return {
        "section_id": SECTION_ID,
        "year": year,
        "type": "la",
        "source": source,
        "courses": split_langue_courses(seeded),
    }


def _science_2018(questions: list[dict], source: str) -> dict | None:
    apply_answers(questions, SCIENCE_2018_ANSWERS)
    return paper(2018, "sc", "Sciences", questions, source=source)


def merge_papers(papers: list[dict]) -> list[dict]:
    """Keep first paper per year+type+course fingerprint."""
    merged: list[dict] = []
    seen: set[str] = set()
    for item in papers:
        for course in item["courses"]:
            first = (course["questions"][0]["question"] if course["questions"] else "")[
                :80
            ]
            key = f"{item['year']}::{item['type']}::{course['course']}::{first.lower()}"
            if key in seen:
                continue
            seen.add(key)
            merged.append(
                {
                    "section_id": item["section_id"],
                    "year": item["year"],
                    "type": item["type"],
                    "source": item.get("source", ""),
                    "courses": [course],
                }
            )
    # Re-group courses that belong to the same item
    grouped: dict[str, dict] = {}
    for item in merged:
        item_key = f"{item['year']}::{item['type']}"
        if item_key not in grouped:
            grouped[item_key] = {
                "section_id": item["section_id"],
                "year": item["year"],
                "type": item["type"],
                "source": item.get("source", ""),
                "courses": [],
            }
        existing_names = {c["course"] for c in grouped[item_key]["courses"]}
        existing_fps = {
            (c["questions"][0]["question"][:80].lower() if c["questions"] else "")
            for c in grouped[item_key]["courses"]
        }
        for course in item["courses"]:
            first = (
                course["questions"][0]["question"][:80].lower()
                if course["questions"]
                else ""
            )
            if first and first in existing_fps:
                continue
            name = course["course"]
            if name in existing_names:
                suffix = 2
                while f"{name} ({suffix})" in existing_names:
                    suffix += 1
                course = {**course, "course": f"{name} ({suffix})"}
                name = course["course"]
            existing_names.add(name)
            existing_fps.add(first)
            grouped[item_key]["courses"].append(course)
    return list(grouped.values())


def write_papers(papers: list[dict]) -> None:
    COLLECTED_DIR.mkdir(parents=True, exist_ok=True)
    for old in COLLECTED_DIR.glob("*.json"):
        old.unlink()

    index = []
    for paper_data in papers:
        filename = f"{paper_data['year']}-{paper_data['type']}.json"
        path = COLLECTED_DIR / filename
        # If two papers share year+type (shouldn't after merge), suffix.
        if path.exists():
            filename = f"{paper_data['year']}-{paper_data['type']}-extra.json"
            path = COLLECTED_DIR / filename
        path.write_text(
            json.dumps(paper_data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        question_count = sum(len(c["questions"]) for c in paper_data["courses"])
        index.append(
            {
                "file": filename,
                "year": paper_data["year"],
                "type": paper_data["type"],
                "courses": [c["course"] for c in paper_data["courses"]],
                "questions": question_count,
                "source": paper_data.get("source", ""),
            }
        )
        print(
            f"  wrote {filename} ({question_count} questions, "
            f"courses={index[-1]['courses']})"
        )

    (COLLECTED_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    print("Collecting lookup exam data...\n")
    papers: list[dict] = []

    langue = load_langue_2015()
    if langue:
        papers.append(langue)
        print("  loaded langue 2015 dump")

    dump_papers = load_comment_dumps()
    papers.extend(dump_papers)
    print(f"  loaded {len(dump_papers)} papers from math-physique dumps")

    links_path = ROOT / "exam_links.json"
    urls = json.loads(links_path.read_text(encoding="utf-8")) if links_path.exists() else []
    print(f"\nScraping {len(urls)} Schoolap exam URLs...")
    for i, url in enumerate(urls, 1):
        scraped = scrape_exam(url)
        if scraped:
            papers.append(scraped)
            n = sum(len(c["questions"]) for c in scraped["courses"])
            print(f"  [{i}/{len(urls)}] {scraped['year']} {scraped['type']} ({n} q)")
        if i < len(urls):
            time.sleep(1.5)

    merged = merge_papers(papers)
    print(f"\nWriting {len(merged)} unique papers to {COLLECTED_DIR}")
    write_papers(merged)
    print("\nDone.")


if __name__ == "__main__":
    main()
