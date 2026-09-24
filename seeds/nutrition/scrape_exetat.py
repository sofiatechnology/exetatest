#!/usr/bin/env python3
"""Scrape Schoolap Nutrition (option 20) into yearly exetat seeds.

Source listing:
https://www.schoolap.com/exetats/filter?q=&branch=*&option=20

Writes one TypeScript file per year in ./exetat/{year}.ts plus ./exetat/index.ts.
Course names come from cours-list.md (bulletin of the section).
Formula images are kept as markdown image links so the question stays usable.
Open prompts without choices (dissertation) are skipped.
"""

from __future__ import annotations

import html
import json
import re
import time
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXETAT_DIR = ROOT / "exetat"
CACHE_DIR = Path("/tmp/schoolap-nutrition-cache")
LISTING = "https://www.schoolap.com/exetats/filter?q=&branch=*&option=20&page={page}"
SECTION_ID = "17"
OPTION_BADGE = "Nutrition"
SOURCE = "https://www.schoolap.com/exetats/filter?q=&branch=*&option=20"

RELIGION = "Religion"
EDVIE = "Éducation à la vie"
ECM = "Éducation civique et morale"
EDPHYS = "Éducation physique"
GEO = "Géographie"
HISTOIRE = "Histoire"
PHYSIQUE = "Physique"
CHIMIE = "Chimie"
MATH = "Mathématiques"
ANATOMIE = "Anatomie et physiologie"
DIET = "Diététique"
INFO = "Informatique"
ENTREPRENEURIAT = "Entrepreneuriat"
CULINAIRE = "Technologie culinaire"
PRATIQUE = "Pratique professionnelle"
ANGLAIS = "Anglais"
FRANCAIS = "Français"

TYPE_ORDER = ("cg", "sc", "co", "la")

# First matching rule wins. Phrases are accent-insensitive.
# A later pass keeps only courses that belong to the paper type.
STRONG_RULES: list[tuple[str, list[str]]] = [
    (
        RELIGION,
        [
            r"\bbible\b",
            r"\beglise\b",
            r"\bislam\b",
            r"musulman",
            r"chretien",
            r"\bjesus\b",
            r"\bpriere\b",
            r"\breligion\b",
            r"catechisme",
            r"\bcoran\b",
            r"catholique",
            r"protestant",
            r"\bdieu\b",
        ],
    ),
    (
        EDVIE,
        [
            r"education a la vie",
            r"\bsida\b",
            r"\bvih\b",
            r"\bist\b",
            r"sexualite",
            r"contraception",
            r"\bdrogue\b",
            r"tabagisme",
            r"alcoolisme",
            r"paludisme",
            r"\bvaccin\b",
            r"coronavirus",
            r"\bcovid\b",
            r"postillon",
            r"distanciation",
            r"hygiene",
        ],
    ),
    (
        ECM,
        [
            r"constitution",
            r"pouvoir judiciaire",
            r"pouvoir executif",
            r"pouvoir legislatif",
            r"pouvoir reglementaire",
            r"\bcitoyen\b",
            r"droits de l'homme",
            r"civisme",
            r"referendum",
            r"hymne national",
            r"\bdevise\b",
            r"systeme politique",
            r"embleme",
            r"separation des pouvoirs",
            r"assemblee nationale",
            r"\bsenat\b",
            r"souverainete",
            r"forces armees",
            r"police nationale",
            r"execution des lois",
            r"premier ministre",
            r"\bdecret\b",
            r"vice-president",
            r"vice president",
            r"monarchie",
            r"theocratie",
            r"oligarchie",
            r"ploutocratie",
            r"aristocratie",
        ],
    ),
    (
        EDPHYS,
        [
            r"education physique",
            r"\bathletisme\b",
            r"\bgymnastique\b",
            r"\bfootball\b",
            r"\bbasket\b",
            r"\bnatation\b",
            r"\bsportif\b",
            r"\bsportive\b",
        ],
    ),
    (
        GEO,
        [
            r"\bgeographie\b",
            r"\bclimat\b",
            r"\blatitude\b",
            r"\blongitude\b",
            r"\brelief\b",
            r"\bdemographie\b",
            r"equateur",
            r"meridien",
        ],
    ),
    (
        HISTOIRE,
        [
            r"\bpresident\b",
            r"secretaire general",
            r"nations unies",
            r"\budps\b",
            r"\bpprd\b",
            r"union sacree",
            r"\bplateforme\b",
            r"parti politique",
            r"formation politique",
            r"\bindependance\b",
            r"\bhistoire\b",
            r"\bcolonie\b",
            r"\bcolonisation\b",
            r"refugie",
            r"\bhcr\b",
            r"union africaine",
        ],
    ),
    (
        MATH,
        [
            r"fonction definie",
            r"\bf\(x\)",
            r"soit f\b",
            r"\bintegrale\b",
            r"logarithme",
            r"\bellipse\b",
            r"\bvariance\b",
            r"probabilite",
            r"nombre derive",
            r"nombre complexe",
            r"\bmatrice\b",
            r"\bvecteur\b",
            r"triangle rectangle",
            r"domaine de definition",
            r"\bsondage\b",
            r"echantillon pris",
            r"\btangente\b",
            r"abscisse",
            r"ordonnee",
            r"courbe representative",
            r"\bf'",
            r"est croissante",
            r"maximum d'ordonnee",
            r"\bintervalle\b",
        ],
    ),
    (
        ANATOMIE,
        [
            r"\bmeiose\b",
            r"\bmitose\b",
            r"chromosome",
            r"\bgene\b",
            r"\bgenes\b",
            r"genotype",
            r"phenotype",
            r"\bmendel\b",
            r"\badn\b",
            r"\bhormone\b",
            r"photosynthese",
            r"ecosysteme",
            r"\bdarwin\b",
            r"lamarck",
            r"groupe sanguin",
            r"fecondation",
            r"\bgamete\b",
            r"\ballele\b",
            r"heredite",
            r"centromere",
            r"prophase",
            r"metaphase",
            r"anaphase",
            r"telophase",
            r"leptotene",
            r"\bpedigree\b",
            r"hemophilie",
            r"spermatozo",
            r"\bgonie\b",
            r"\bhybride\b",
            r"heterozygote",
            r"homozygote",
            r"ichtyostega",
            r"symbiose",
            r"\banatomie\b",
            r"physiologie",
            r"\bcellule\b",
            r"pelage",
            r"\bcobaye\b",
            r"\borgane\b",
            r"\bsquelette\b",
            r"\bdigestion\b",
        ],
    ),
    (
        CHIMIE,
        [
            r"\bmolecule\b",
            r"\batome\b",
            r"\bacide\b",
            r"\bbase\b",
            r"\bph\b",
            r"reaction chimique",
            r"tableau periodique",
            r"\boxydation\b",
            r"\bvalence\b",
            r"\bmolaire\b",
            r"\bchimie\b",
        ],
    ),
    (
        PHYSIQUE,
        [
            r"courant continu",
            r"\bnewton\b",
            r"\bvolt\b",
            r"\bwatt\b",
            r"\bohm\b",
            r"circuit electrique",
            r"\bphysique\b",
            r"\boptique\b",
            r"\bforce\b",
        ],
    ),
    (
        DIET,
        [
            r"\bdietetique\b",
            r"\bcalorie\b",
            r"\bnutriment\b",
            r"\bvitamine\b",
            r"\bproteine\b",
            r"\bglucide\b",
            r"\blipide\b",
            r"ration alimentaire",
            r"\bmenu\b",
            r"valeur nutritive",
            r"\bnutrition\b",
        ],
    ),
    (
        INFO,
        [
            r"\binformatique\b",
            r"\bordinateur\b",
            r"\blogiciel\b",
            r"\bclavier\b",
            r"memoire vive",
            r"\bprocesseur\b",
            r"\btableur\b",
            r"\balgorithme\b",
        ],
    ),
    (
        ENTREPRENEURIAT,
        [
            r"entrepreneuriat",
            r"\bentrepreneur\b",
            r"plan d'affaires",
            r"business plan",
            r"\bstartup\b",
        ],
    ),
    (
        CULINAIRE,
        [
            r"\bculinaire\b",
            r"\bcuisson\b",
            r"\brecette\b",
            r"technologie culinaire",
            r"art culinaire",
        ],
    ),
    (
        PRATIQUE,
        [
            r"pratique professionnelle",
            r"situation d'integration",
        ],
    ),
    (
        ANGLAIS,
        [
            r"english text",
            r"according to the text",
            r"questions based on the text",
            r"questions out of the text",
            r"which of the following",
            r"vowel sound",
        ],
    ),
    (
        FRANCAIS,
        [
            r"texte francais",
            r"textes francais",
            r"dissertation",
            r"participe passe",
            r"proposition subordonnee",
            r"nature grammaticale",
            r"figure de style",
            r"fonction grammaticale",
        ],
    ),
]

HEADER_COURSE = [
    ("english text", ANGLAIS),
    ("questions based on the text", ANGLAIS),
    ("questions out of the text", ANGLAIS),
    ("texte francais", FRANCAIS),
    ("texte français", FRANCAIS),
    ("textes francais", FRANCAIS),
    ("textes français", FRANCAIS),
    ("texte française", FRANCAIS),
    ("texte francaise", FRANCAIS),
    ("question sur le texte", FRANCAIS),
    ("questions sur le texte", FRANCAIS),
    ("questions hors-texte", FRANCAIS),
    ("questions hors texte", FRANCAIS),
    ("french text", FRANCAIS),
    ("texte de francais", FRANCAIS),
]

SECTION_HEADERS = {
    "english text",
    "questions based on the text",
    "questions out of the text",
    "texte francais",
    "texte français",
    "textes francais",
    "textes français",
    "texte française",
    "texte francaise",
    "question sur le texte",
    "questions sur le texte",
    "questions hors-texte",
    "questions hors texte",
    "french text",
    "texte de francais",
    "dissertation",
}

COURSE_TYPE = {
    RELIGION: "cg",
    EDVIE: "cg",
    ECM: "cg",
    EDPHYS: "cg",
    GEO: "cg",
    HISTOIRE: "cg",
    PHYSIQUE: "sc",
    CHIMIE: "sc",
    MATH: "sc",
    ANATOMIE: "sc",
    DIET: "sc",
    INFO: "co",
    ENTREPRENEURIAT: "co",
    CULINAIRE: "co",
    PRATIQUE: "co",
    ANGLAIS: "la",
    FRANCAIS: "la",
}

FALLBACK = {
    "cg": HISTOIRE,
    "sc": ANATOMIE,
    "co": PRATIQUE,
    "la": FRANCAIS,
}

TAG_RE = re.compile(r"<[^>]+>")
IMG_RE = re.compile(
    r"<img\b[^>]*?\bsrc\s*=\s*[\"']([^\"']+)[\"'][^>]*>",
    re.I,
)
SUP_MAP = str.maketrans("0123456789+-=()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ")
SESSION_RE = re.compile(r"Session\s*:\s*(\d{4})", re.I)
QUESTION_BLOCK_RE = re.compile(
    r'<div class="my-3">(.*?)(?=<div class="my-3"|<button|</form>)',
    re.S | re.I,
)
OPTION_RE = re.compile(
    r'<div class="assertion">\s*([A-F])\s*</div>\s*'
    r'<div class="assertion-content">(.*?)</div>',
    re.S | re.I,
)
P_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.S | re.I)
MARKER_RE = re.compile(
    r"questions?\s+based\s+on\s+the\s+text|questions?\s+out\s+of\s+the\s+text|"
    r"questions?\s+sur\s+le\s+texte|questions?\s+hors[-\s]?texte",
    re.I,
)


def question_fingerprint(question: str, options: list[str] | None = None) -> str:
    text = fold(question)
    if options:
        text += " " + fold(" ".join(options))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return text.strip()


def fold(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = value.replace("’", "'").replace("`", "'")
    return value.lower()


def to_superscript(fragment: str) -> str:
    inner = TAG_RE.sub("", fragment)
    inner = html.unescape(inner).strip()
    return inner.translate(SUP_MAP)


def image_src(src: str) -> str:
    if src.startswith("/"):
        return "https://www.schoolap.com" + src
    return src


def strip_html(value: str) -> str:
    value = IMG_RE.sub(lambda match: f" ![]({image_src(match.group(1))}) ", value)
    value = re.sub(
        r"<sup[^>]*>(.*?)</sup>",
        lambda match: to_superscript(match.group(1)),
        value,
        flags=re.I | re.S,
    )
    value = re.sub(r"<sub[^>]*>(.*?)</sub>", r"\1", value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = TAG_RE.sub(" ", value)
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    value = re.sub(r" +([,.;:)])", r"\1", value)
    return value.strip()


def paragraphs(fragment: str) -> list[str]:
    found = [strip_html(part) for part in P_RE.findall(fragment)]
    found = [part for part in found if part]
    if not found:
        text = strip_html(fragment)
        found = [text] if text else []
    lines: list[str] = []
    for part in found:
        for line in part.split("\n"):
            line = line.strip()
            if line:
                lines.append(line)
    return lines


def cache_path(url: str) -> Path:
    key = re.sub(r"[^a-zA-Z0-9]+", "_", url)[-180:]
    return CACHE_DIR / f"{key}.html"


def fetch(url: str) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = cache_path(url)
    if cached.exists() and cached.stat().st_size > 800:
        return cached.read_text(encoding="utf-8")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
    )
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read().decode("utf-8", "replace")
            if len(payload) < 400:
                raise RuntimeError("short response")
            cached.write_text(payload, encoding="utf-8")
            return payload
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 503):
                raise RuntimeError(f"failed {url}: HTTP Error {exc.code}") from exc
            last_error = exc
            time.sleep(1.4 * (attempt + 1))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.4 * (attempt + 1))
    raise RuntimeError(f"failed {url}: {last_error}")


def parse_listing(page_html: str) -> list[dict]:
    blocks = page_html.split('class="card__blade s-card-item"')[1:]
    rows = []
    for block in blocks:
        hrefs = re.findall(
            r'href="(https://www\.schoolap\.com/exetats/\d+/[^"]+)"',
            block,
        )
        if not hrefs:
            continue
        badge = re.search(r'badge__notice__item"[^>]*>([^<]+)', block)
        title = re.search(r's-card-title-item[^>]*>([^<]+)', block)
        year = re.search(r"Year\s*:\s*(\d{4})", block)
        badge_text = html.unescape(badge.group(1)).strip() if badge else ""
        if badge_text != OPTION_BADGE:
            continue
        title_text = strip_html(title.group(1)) if title else ""
        rows.append(
            {
                "url": hrefs[0],
                "title": title_text,
                "year": int(year.group(1)) if year else None,
            }
        )
    return rows


def collect_listings() -> list[dict]:
    found: dict[str, dict] = {}
    page = 1
    while page <= 20:
        url = LISTING.format(page=page)
        print(f"listing page {page}", flush=True)
        page_html = fetch(url)
        rows = parse_listing(page_html)
        fresh = 0
        for row in rows:
            if row["url"] not in found:
                found[row["url"]] = row
                fresh += 1
        print(f"  cards={len(rows)} new={fresh}", flush=True)
        if len(rows) == 0:
            break
        page += 1
        time.sleep(0.15)
    return list(found.values())


def resolve_type(row: dict) -> str | None:
    url = row["url"].lower()
    title = fold(html.unescape(row.get("title") or ""))
    if "/culture-generale/" in url or "culture" in title:
        return "cg"
    if "/science/" in url or "biolog" in title or "science" in title:
        return "sc"
    if "/option/" in url or "option" in title:
        return "co"
    if (
        "/langue/" in url
        or "langue" in title
        or "anglais" in title
        or "francais" in title
    ):
        return "la"
    if "/hors-session/" in url or "dissertation" in title:
        return "la"
    return None


def is_header(text: str) -> bool:
    folded = fold(text).strip(" .:-")
    if folded in SECTION_HEADERS:
        return True
    return folded.startswith("texte ") and len(folded) < 24


def course_from_headers(text: str, item_type: str) -> str | None:
    folded = fold(text)
    for needle, course in HEADER_COURSE:
        if needle not in folded:
            continue
        if course in (ANGLAIS, FRANCAIS) and item_type != "la":
            continue
        return course
    return None


def match_rules(folded: str, paper_type: str) -> str | None:
    for name, patterns in STRONG_RULES:
        if COURSE_TYPE.get(name) != paper_type:
            continue
        for pattern in patterns:
            if re.search(pattern, folded):
                return name
    return None


def looks_like_math(folded: str, paper_type: str) -> bool:
    if paper_type != "sc":
        return False
    if re.search(r"f'|tangente|abscisse|ordonnee|croissante", folded):
        return True
    if re.search(r"[\[\]]\s*-?\d", folded):
        return True
    stripped = re.sub(r"!\[\]\([^)]*\)", "", folded).strip()
    return "![](" in folded and len(stripped) < 80


def score_course(question: str, options: str, paper_type: str) -> str:
    folded_question = fold(question)
    found = match_rules(folded_question, paper_type)
    if found is None:
        found = match_rules(fold(question + "\n" + options), paper_type)
    if found:
        return found
    folded = fold(question + "\n" + options)
    if looks_like_math(folded, paper_type):
        return MATH
    if paper_type == "la" and re.search(r"appareil photo|digital camera", folded):
        return ANGLAIS
    if paper_type == "la":
        french_hits = len(
            re.findall(
                r"\b(le|la|les|des|une|est|dans|qui|pour|avec|cette|indiquez)\b",
                folded,
            )
        )
        english_hits = len(
            re.findall(
                r"\b(the|and|of|to|in|is|are|which|means|following)\b",
                folded,
            )
        )
        if english_hits > french_hits + 1:
            return ANGLAIS
        return FRANCAIS
    return FALLBACK[paper_type]


def is_garbage(text: str) -> bool:
    folded = fold(text)
    if "mso-style" in folded or "msonormaltable" in folded:
        return True
    if "style definitions" in folded:
        return True
    return False


def clean_option(value: str) -> str:
    text = strip_html(value)
    text = re.sub(r"^[1-5]\s*[\.\)]\s+", "", text).strip()
    if text.upper() == "ABR":
        return ""
    if is_garbage(text):
        return ""
    return text


def clean_question(value: str) -> str:
    text = re.sub(r"^question\s+\d+\s*", "", value, flags=re.I).strip()
    text = re.sub(r"^\d+\s*[\.\)]\s+", "", text).strip()
    text = re.sub(r"^\.\s*", "", text).strip()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def prompt_and_passage(paras: list[str]) -> tuple[str, str | None]:
    marker_at = None
    for index, part in enumerate(paras):
        if MARKER_RE.search(fold(part)) and len(part) < 90:
            marker_at = index
            break
    if marker_at is not None:
        passage_parts = [part for part in paras[:marker_at] if not is_header(part)]
        question_parts = [part for part in paras[marker_at + 1 :] if not is_header(part)]
        passage = "\n\n".join(passage_parts).strip()
        question = " ".join(question_parts).strip()
        if len(passage) < 80:
            return question or " ".join(question_parts), None
        return question, passage

    body = [part for part in paras if not is_header(part)]
    if not body:
        return "", None
    long_prefix = any(len(part) >= 180 for part in body[:-1])
    if long_prefix and len(body) >= 2 and len(body[-1]) < 220:
        passage = "\n\n".join(body[:-1]).strip()
        question = body[-1].strip()
        if len(passage) >= 180:
            return question, passage
    return " ".join(body), None


def parse_exam(page_html: str) -> tuple[int | None, list[dict]]:
    session = SESSION_RE.search(page_html)
    year = int(session.group(1)) if session else None
    questions = []
    for block in QUESTION_BLOCK_RE.finditer(page_html):
        chunk = block.group(1)
        if not re.search(r"question", chunk, re.I):
            continue
        question_html = re.split(r"<ul", chunk, maxsplit=1, flags=re.I)[0]
        question_html = re.split(
            r'<div class="assertion"', question_html, maxsplit=1, flags=re.I
        )[0]
        paras = paragraphs(question_html)
        options = []
        for _letter, raw in OPTION_RE.findall(block.group(0)):
            text = clean_option(raw)
            if text:
                options.append(text)
        if len(options) < 2:
            continue
        questions.append(
            {
                "paragraphs": paras,
                "full": "\n".join(paras),
                "options": options[:8],
            }
        )
    return year, questions


def build_courses(item_type: str, questions: list[dict], title: str) -> list[dict]:
    del title
    buckets: dict[tuple[str, str], dict] = {}
    order: list[tuple[str, str]] = []
    current_course: str | None = None
    current_passage: str | None = None

    for raw in questions:
        full = raw["full"]
        if is_garbage(full):
            continue
        header_course = course_from_headers(full, item_type)
        if item_type == "la":
            question, passage = prompt_and_passage(raw["paragraphs"])
        else:
            question = clean_question(" ".join(raw["paragraphs"]))
            passage = None
        question = clean_question(question)

        if item_type == "la" and header_course in (ANGLAIS, FRANCAIS):
            current_course = header_course
            if passage:
                current_passage = passage
        elif item_type == "la" and current_course and header_course is None:
            header_course = current_course

        if not question or len(question) < 8 or is_garbage(question):
            continue

        if header_course and header_course in COURSE_TYPE:
            course = header_course
            used_passage = current_passage if item_type == "la" else None
        else:
            course = score_course(full, " ".join(raw["options"]), item_type)
            if course not in COURSE_TYPE:
                continue
            used_passage = None
            if item_type == "la" and course == current_course:
                used_passage = current_passage

        if used_passage and used_passage in question:
            question = question.replace(used_passage, "").strip() or question

        key = (course, used_passage or "")
        if key not in buckets:
            buckets[key] = {
                "course": course,
                "passage": used_passage,
                "questions": [],
                "seen": set(),
            }
            order.append(key)
        fingerprint = question_fingerprint(question, raw["options"])
        if fingerprint in buckets[key]["seen"]:
            continue
        buckets[key]["seen"].add(fingerprint)
        buckets[key]["questions"].append(
            {
                "question": question,
                "options": raw["options"],
                "answer": 0,
            }
        )

    courses = []
    for key in order:
        bucket = buckets[key]
        if bucket["questions"]:
            courses.append(
                {
                    "course": bucket["course"],
                    "type": COURSE_TYPE[bucket["course"]],
                    "passage": bucket["passage"],
                    "questions": bucket["questions"],
                }
            )
    return courses


def scrape_one(row: dict) -> dict | None:
    item_type = resolve_type(row)
    if item_type is None:
        print(f"  skip unrelated {row['url']} ({row.get('title')})")
        return None
    url = row["url"]
    try:
        page_html = fetch(url)
    except Exception as exc:  # noqa: BLE001
        print(f"  fail {url}: {exc}")
        return None
    year, questions = parse_exam(page_html)
    year = year or row.get("year")
    if not year or not questions:
        print(
            f"  skip {url} year={year} questions={len(questions)} title={row.get('title')}"
        )
        return None
    courses = build_courses(item_type, questions, row.get("title") or "")
    if not courses:
        print(f"  skip empty courses {url}")
        return None
    return {
        "year": year,
        "type": item_type,
        "url": url,
        "title": row.get("title") or "",
        "courses": courses,
    }


def merge_papers(papers: list[dict]) -> list[dict]:
    grouped: dict[tuple[int, str], dict] = {}
    seen_paper: set[str] = set()
    for paper in papers:
        if paper["url"] in seen_paper:
            continue
        seen_paper.add(paper["url"])
        for course in paper["courses"]:
            item_type = course["type"]
            item_key = (paper["year"], item_type)
            if item_key not in grouped:
                grouped[item_key] = {
                    "type": item_type,
                    "sources": [],
                    "courses": [],
                }
            item = grouped[item_key]
            if paper["url"] not in item["sources"]:
                item["sources"].append(paper["url"])
            match = next(
                (
                    existing
                    for existing in item["courses"]
                    if existing["course"] == course["course"]
                    and (existing["passage"] or "") == (course["passage"] or "")
                ),
                None,
            )
            if match is None:
                item["courses"].append(
                    {
                        "course": course["course"],
                        "passage": course["passage"],
                        "questions": list(course["questions"]),
                        "_seen": {
                            question_fingerprint(q["question"], q["options"])
                            for q in course["questions"]
                        },
                    }
                )
                continue
            for question in course["questions"]:
                fingerprint = question_fingerprint(
                    question["question"], question["options"]
                )
                if fingerprint in match["_seen"]:
                    continue
                match["_seen"].add(fingerprint)
                match["questions"].append(question)

    years: dict[int, dict] = {}
    for (year, item_type), item in grouped.items():
        clean_courses = []
        for course in item["courses"]:
            course.pop("_seen", None)
            if course["questions"]:
                clean_courses.append(course)
        if not clean_courses:
            continue
        years.setdefault(
            year, {"sectionId": SECTION_ID, "year": year, "items": []}
        )
        years[year]["items"].append(
            {
                "type": item_type,
                "sources": item["sources"],
                "courses": clean_courses,
            }
        )
    result = []
    for year in sorted(years):
        items = sorted(
            years[year]["items"],
            key=lambda item: TYPE_ORDER.index(item["type"]),
        )
        result.append({**years[year], "items": items})
    return result


def write_year_files(years: list[dict]) -> None:
    EXETAT_DIR.mkdir(parents=True, exist_ok=True)
    for old in EXETAT_DIR.glob("*.ts"):
        old.unlink()

    imports = []
    names = []
    for year_data in years:
        year = year_data["year"]
        payload = json.dumps(year_data, ensure_ascii=False, indent=2)
        content = (
            "import type { YearSeed } from '../seed-types';\n\n"
            "// Nutrition, section 17.\n"
            f"// Source: {SOURCE}\n"
            "// Schoolap does not publish the correct option, so answer is 0.\n"
            f"const year: YearSeed = {payload};\n\n"
            "export default year;\n"
        )
        (EXETAT_DIR / f"{year}.ts").write_text(content, encoding="utf-8")
        imports.append(f"import year{year} from './{year}';")
        names.append(f"year{year}")
        questions = sum(
            len(course["questions"])
            for item in year_data["items"]
            for course in item["courses"]
        )
        print(f"wrote {year}.ts ({questions} questions)")

    index = (
        "import type { YearSeed } from '../seed-types';\n"
        + "\n".join(imports)
        + "\n\nexport const years: YearSeed[] = [\n  "
        + ",\n  ".join(names)
        + ",\n];\n"
    )
    (EXETAT_DIR / "index.ts").write_text(index, encoding="utf-8")
    print(f"wrote index.ts ({len(years)} years)")


def summarize(years: list[dict]) -> None:
    print("\nSummary")
    for year_data in years:
        parts = []
        for item in year_data["items"]:
            count = sum(len(course["questions"]) for course in item["courses"])
            courses = ", ".join(
                f"{course['course']}({len(course['questions'])})"
                for course in item["courses"]
            )
            parts.append(f"{item['type']}={count} [{courses}]")
        print(f"  {year_data['year']}: " + " | ".join(parts))


def main() -> None:
    listings = collect_listings()
    print(f"\nScraping {len(listings)} exam pages...")
    papers: list[dict] = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(scrape_one, row) for row in listings]
        done = 0
        for future in as_completed(futures):
            done += 1
            paper = future.result()
            if paper:
                papers.append(paper)
                n = sum(len(c["questions"]) for c in paper["courses"])
                print(
                    f"  [{done}/{len(listings)}] {paper['year']} {paper['type']} {n}q {paper['title']}",
                    flush=True,
                )
            else:
                print(f"  [{done}/{len(listings)}] skipped", flush=True)
    years = merge_papers(papers)
    write_year_files(years)
    summarize(years)


if __name__ == "__main__":
    main()
