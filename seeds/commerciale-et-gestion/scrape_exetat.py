#!/usr/bin/env python3
"""Scrape Schoolap Commerciale Administrative (option 14) into yearly exetat seeds.

Source listing:
https://www.schoolap.com/exetats/filter?q=&branch=*&option=14

Writes one TypeScript file per year in ./exetat/{year}.ts plus ./exetat/index.ts.
"""

from __future__ import annotations

import html
import json
import re
import time
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXETAT_DIR = ROOT / "exetat"
CACHE_DIR = Path("/tmp/schoolap-commerciale-cache")
LISTING = "https://www.schoolap.com/exetats/filter?q=&branch={branch}&option=14&page={page}"
SECTION_ID = "03"
OPTION_BADGE = "Commerciale Administrative"

BRANCH_TYPE = {
    "1": "cg",  # culture-generale
    "2": "sc",  # science
    "3": "co",  # option / cours d'option
    "4": "la",  # langue
}

TYPE_ORDER = ("cg", "sc", "co", "la")

# Official names from cours-list.md. Keyword lists are accent-insensitive.
COURSE_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        "Religion",
        [
            "bible", "eglise", "islam", "musulman", "chretien", "dieu",
            "jesus", "priere", "religion", "catechisme", "coran",
            "catholique", "protestant", "pentecote", "adventiste",
            "synagogue", "mosquee", "foi religieuse",
        ],
    ),
    (
        "Éducation à la vie",
        [
            "education a la vie", "sida", "vih", "ist", "mst", "sexualite",
            "contraception", "puberte", "grossesse", "planning familial",
            "drogue", "tabagisme", "alcoolisme", "hygiene", "nutrition",
            "paludisme", "vaccin",
        ],
    ),
    (
        "Éducation physique",
        [
            "education physique", "athletisme", "gymnastique", "echauffement",
            "natation", "football", "basket", "muscle", "olympique", "sportif",
            "sportive",
        ],
    ),
    (
        "Informatique",
        [
            "informatique", "ordinateur", "logiciel", "internet", "clavier",
            "windows", "excel", "fichier", "processeur", "memoire vive",
            "tableur", "navigateur",
        ],
    ),
    (
        "Fiscalité",
        [
            "fiscalite", "impot", "taxes", "tva", "contribuable",
            "declaration fiscale", "direction generale des impots", "redevance",
        ],
    ),
    (
        "Opérations des banques et des crédits",
        [
            "banque", "cheque", "virement", "compte courant", "depot a terme",
            "agios", "lettre de credit", "credit bancaire", "equity", "bcdc",
            "tirage", "escompte bancaire", "guichet",
        ],
    ),
    (
        "Mathématiques financières",
        [
            "interet", "capital", "emprunt", "escompte", "amortissement",
            "annuite", "valeur acquise", "placement", "coefficient du capital",
            "taux d'interet", "interet simple", "interet compose",
        ],
    ),
    (
        "Comptabilité générale",
        [
            "comptabilite", "comptable", "bilan", "grand livre", "debit", "credit",
            "actif", "passif", "immobilisation", "journal comptable",
            "balance", "compte de resultat", "partie double", "ecriture comptable",
            "chiffre d'affaires", "prix de revient", "centre d'analyse",
            "hors-exploitation", "coefficient multiplicateur", "stock final",
            "stock reel", "charges revenant", "boni", "atelier",
            "point de commande",
        ],
    ),
    (
        "Droit",
        [
            "code civil", "code de commerce", "contrat", "tribunal",
            "personne morale", "societe anonyme", "capacite juridique",
            "obligation juridique", "droit commercial", "le droit",
            "code du travail", "legislation",
        ],
    ),
    (
        "Correspondance commerciale anglaise",
        [
            "english correspondence", "dear sir", "dear madam", "yours sincerely",
            "yours faithfully", "complaint letter", "application letter",
            "commercial correspondence",
        ],
    ),
    (
        "Correspondance commerciale française",
        [
            "lettre commerciale", "correspondance commerciale",
            "formule de politesse", "destinataire", "objet de la lettre",
            "courtoisie", "concision", "appel de la lettre",
        ],
    ),
    (
        "Anglais",
        [
            "english text", "questions based on the text", "the word",
            "stressed", "synonym", "paragraph", "which of the following",
            "the missing word",
        ],
    ),
    (
        "Français",
        [
            "texte francais", "participe passe", "subordonnee", "orthographe",
            "grammaire", "accord du", "proposition subordonnee",
            "figure de style", "question sur le texte",
        ],
    ),
    (
        "Entreprenariat",
        [
            "entrepreneur", "entreprenariat", "creation d'entreprise",
            "business plan", "start-up", "startup", "auto-emploi",
        ],
    ),
    (
        "Économie politique",
        [
            "economie politique", "marche", "offre et la demande", "inflation",
            "pib", "monopole", "concurrence", "devaluation", "depreciation",
            "taux de change", "parite", "reevaluation", "monnaie",
        ],
    ),
    (
        "Géographie économique",
        [
            "geographie", "quartier", "minerai", "cuivre", "cobalt",
            "hydroelectricite", "fleuve", "climat", "foret", "province",
            "natalite", "hydrographique", "relief", "savane", "diamant",
            "petrole", "collectivite", "geologique", "prehistorique",
            "cereale", "culture industrielle", "sous-sol", "etain",
            "energie nucleaire", "energie domestique", "village", "territoire",
        ],
    ),
    (
        "Éducation civique et morale",
        [
            "constitution", "president", "democratie", "citoyen",
            "droits de l'homme", "parlement", "gouvernement", "election",
            "souverainete", "civisme", "nepad", "onu", "unesco",
            "premier ministre", "securite nationale", "patriotisme",
            "charte", "ordonnance", "decret", "personnalite politique",
        ],
    ),
    (
        "Mathématiques générales",
        [
            "fonction", "equation", "geometrie", "triangle", "derivee",
            "integrale", "probabilite", "intervalle", "courbe", "polynome",
            "calcul", "vecteur", "fraction", "pourcentage", "pythagore",
        ],
    ),
    (
        "Pratique professionnelle",
        [
            "pratique professionnelle", "homme d'affaires", "clientele",
            "deontologie", "agent public", "honnetete", "dignite",
            "stage", "procede",
        ],
    ),
    (
        "Activités complémentaires",
        [
            "visite guidee", "activites complementaires", "excursion",
            "sortie pedagogique",
        ],
    ),
]

HEADER_COURSE = [
    ("english correspondence", "Correspondance commerciale anglaise"),
    ("correspondance anglaise", "Correspondance commerciale anglaise"),
    ("cca", "Correspondance commerciale anglaise"),
    ("correspondance commerciale francaise", "Correspondance commerciale française"),
    ("lettre commerciale", "Correspondance commerciale française"),
    ("ccf", "Correspondance commerciale française"),
    ("english text", "Anglais"),
    ("questions based on the text", "Anglais"),
    ("texte francais", "Français"),
    ("question sur le texte", "Français"),
    ("questions sur le texte", "Français"),
]

SECTION_HEADERS = {
    "english text",
    "questions based on the text",
    "english correspondence",
    "texte francais",
    "texte français",
    "question sur le texte",
    "questions sur le texte",
    "correspondance commerciale",
    "correspondance commerciale francaise",
    "correspondance commerciale anglaise",
    "french text",
    "texte de francais",
}

FALLBACK = {
    "cg": "Géographie économique",
    "sc": "Mathématiques financières",
    "co": "Pratique professionnelle",
    "la": "Français",
}

PREFERRED = {
    "cg": {
        "Religion",
        "Éducation à la vie",
        "Éducation civique et morale",
        "Éducation physique",
        "Géographie économique",
    },
    "sc": {
        "Mathématiques générales",
        "Mathématiques financières",
        "Informatique",
        "Comptabilité générale",
        "Économie politique",
    },
    "co": {
        "Fiscalité",
        "Mathématiques financières",
        "Opérations des banques et des crédits",
        "Droit",
        "Entreprenariat",
        "Économie politique",
        "Comptabilité générale",
        "Pratique professionnelle",
        "Activités complémentaires",
        "Informatique",
    },
    "la": {
        "Anglais",
        "Français",
        "Correspondance commerciale française",
        "Correspondance commerciale anglaise",
    },
}

TAG_RE = re.compile(r"<[^>]+>")
SESSION_RE = re.compile(r"Session\s*:\s*(\d{4})", re.I)
QUESTION_BLOCK_RE = re.compile(
    r'<div class="my-3">(.*?)</ul>\s*</div>',
    re.S | re.I,
)
OPTION_RE = re.compile(
    r'<div class="assertion">\s*([A-F])\s*</div>\s*'
    r'<div class="assertion-content">(.*?)</div>',
    re.S | re.I,
)
P_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.S | re.I)


def fold(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = value.replace("’", "'").replace("`", "'")
    return value.lower()


def strip_html(value: str) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = TAG_RE.sub(" ", value)
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def paragraphs(fragment: str) -> list[str]:
    found = [strip_html(part) for part in P_RE.findall(fragment)]
    found = [part for part in found if part]
    if found:
        return found
    text = strip_html(fragment)
    return [text] if text else []


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
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                payload = response.read().decode("utf-8", "replace")
            cached.write_text(payload, encoding="utf-8")
            return payload
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
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
        code = re.search(r"Test code\s*:\s*([^<]+)", block)
        badge_text = html.unescape(badge.group(1)).strip() if badge else ""
        if badge_text != OPTION_BADGE:
            continue
        rows.append(
            {
                "url": hrefs[0],
                "title": strip_html(title.group(1)) if title else "",
                "year": int(year.group(1)) if year else None,
                "code": strip_html(code.group(1)) if code else "",
            }
        )
    return rows


def collect_listings() -> list[dict]:
    found: dict[str, dict] = {}
    for branch, item_type in BRANCH_TYPE.items():
        page = 1
        stale = 0
        while page <= 25:
            url = LISTING.format(branch=branch, page=page)
            print(f"listing {item_type} page {page}")
            page_html = fetch(url)
            rows = parse_listing(page_html)
            fresh = 0
            for row in rows:
                row["type"] = item_type
                if row["url"] not in found:
                    found[row["url"]] = row
                    fresh += 1
            print(f"  cards={len(rows)} new={fresh}")
            if fresh == 0:
                stale += 1
                if stale >= 1:
                    break
            else:
                stale = 0
            if len(rows) == 0:
                break
            page += 1
            time.sleep(0.3)
    return list(found.values())


def is_header(text: str) -> bool:
    folded = fold(text).strip(" .:-")
    if folded in SECTION_HEADERS:
        return True
    if len(folded) < 48 and any(name in folded for name, _course in HEADER_COURSE[:6]):
        return folded in {name for name, _course in HEADER_COURSE} or folded in SECTION_HEADERS
    return False


def contains_term(folded: str, needle: str) -> bool:
    if len(needle) <= 4:
        return (
            re.search(rf"(?<![a-z]){re.escape(needle)}(?![a-z])", folded) is not None
        )
    return needle in folded


def course_from_headers(text: str) -> str | None:
    folded = fold(text)
    for needle, course in HEADER_COURSE:
        if contains_term(folded, needle):
            return course
    return None


def score_course(text: str, item_type: str) -> tuple[str, int]:
    folded = fold(text)
    best_name = FALLBACK[item_type]
    best_score = 0
    for name, words in COURSE_KEYWORDS:
        score = 0
        for word in words:
            if contains_term(folded, word):
                score += 2 + min(len(word), 28) // 6
        if score > 0 and name in PREFERRED.get(item_type, set()):
            score += 1
        if score > best_score:
            best_score = score
            best_name = name
    if best_score == 0 and item_type == "la":
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
        if english_hits > french_hits:
            return "Anglais", 1
        return "Français", 1
    if best_score == 0 and item_type == "sc":
        if re.search(r"\bfc\b|emprunt|capital|taux", folded):
            return "Mathématiques financières", 1
        if re.search(r"fonction|equation|intervalle|courbe", folded):
            return "Mathématiques générales", 1
    return best_name, best_score


def clean_option(value: str) -> str:
    text = strip_html(value)
    # Drop a leading choice number ("1. Familiaux") without eating "2.427".
    text = re.sub(r"^[1-5]\.\s+", "", text).strip()
    if text.upper() == "ABR":
        return ""
    return text


def clean_question(value: str) -> str:
    text = re.sub(r"^question\s+\d+\s*", "", value, flags=re.I).strip()
    text = re.sub(r"^\d+\s*[\.\)]\s+", "", text).strip()
    text = re.sub(r"^\.\s*", "", text).strip()
    return text


def prompt_and_passage(paras: list[str]) -> tuple[str, str | None]:
    body = [part for part in paras if not is_header(part)]
    if not body:
        return "", None
    if len(body) >= 3 and len(body[-1]) < 420:
        passage = "\n\n".join(body[:-1]).strip()
        question = body[-1].strip()
        if len(passage) < 80:
            return " ".join(body), None
        return question, passage
    return " ".join(body), None


def parse_exam(page_html: str) -> tuple[int | None, list[dict]]:
    session = SESSION_RE.search(page_html)
    year = int(session.group(1)) if session else None
    questions = []
    for block in QUESTION_BLOCK_RE.finditer(page_html):
        chunk = block.group(1)
        question_html = re.split(r"<ul", chunk, maxsplit=1, flags=re.I)[0]
        paras = paragraphs(question_html)
        options = []
        for _letter, raw in OPTION_RE.findall(block.group(0)):
            text = clean_option(raw)
            if text:
                options.append(text)
        if len(options) < 2:
            continue
        full_text = "\n".join(paras)
        questions.append(
            {
                "paragraphs": paras,
                "full": full_text,
                "options": options[:8],
            }
        )
    return year, questions


def build_courses(item_type: str, questions: list[dict]) -> list[dict]:
    buckets: dict[tuple[str, str], dict] = {}
    order: list[tuple[str, str]] = []
    current_course: str | None = None
    current_passage: str | None = None

    for raw in questions:
        full = raw["full"]
        header_course = course_from_headers(full)
        if item_type == "la":
            question, passage = prompt_and_passage(raw["paragraphs"])
        else:
            question = clean_question(" ".join(raw["paragraphs"]))
            passage = None
        question = clean_question(question)
        if not question:
            continue

        if item_type == "la" and header_course:
            current_course = header_course
            if passage:
                current_passage = passage
        elif item_type == "la" and current_course:
            header_course = current_course
        else:
            header_course = None

        if header_course:
            course = header_course
            used_passage = current_passage
        else:
            course, _score = score_course(full, item_type)
            used_passage = None if item_type != "la" else current_passage

        # Don't repeat a long reading text inside every question.
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
        fingerprint = re.sub(r"\s+", " ", fold(question))[:180]
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
                    "passage": bucket["passage"],
                    "questions": bucket["questions"],
                }
            )
    return courses


def refine_type(row: dict) -> str:
    url = row["url"].lower()
    title = fold(row.get("title") or "")
    if "/culture-generale/" in url or "/science/" in url:
        return row["type"]
    blob = f"{url} {title}"
    if any(token in blob for token in ("langue", "anglais", "francais")):
        return "la"
    return row["type"]


def scrape_one(row: dict) -> dict | None:
    url = row["url"]
    item_type = refine_type(row)
    try:
        page_html = fetch(url)
    except Exception as exc:  # noqa: BLE001
        print(f"  fail {url}: {exc}")
        return None
    year, questions = parse_exam(page_html)
    year = year or row.get("year")
    if not year or not questions:
        print(f"  skip {url} year={year} questions={len(questions)}")
        return None
    courses = build_courses(item_type, questions)
    if not courses:
        print(f"  skip empty courses {url}")
        return None
    fingerprint = fold(courses[0]["questions"][0]["question"])[:120]
    return {
        "year": year,
        "type": item_type,
        "url": url,
        "title": row.get("title") or "",
        "fingerprint": fingerprint,
        "courses": courses,
    }


def merge_papers(papers: list[dict]) -> list[dict]:
    grouped: dict[tuple[int, str], dict] = {}
    seen_paper: set[str] = set()
    for paper in papers:
        paper_key = f"{paper['year']}::{paper['type']}::{paper['fingerprint']}"
        if paper_key in seen_paper:
            continue
        seen_paper.add(paper_key)
        item_key = (paper["year"], paper["type"])
        if item_key not in grouped:
            grouped[item_key] = {
                "type": paper["type"],
                "sources": [],
                "courses": [],
            }
        item = grouped[item_key]
        if paper["url"] not in item["sources"]:
            item["sources"].append(paper["url"])
        for course in paper["courses"]:
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
                            re.sub(r"\s+", " ", fold(q["question"]))[:180]
                            for q in course["questions"]
                        },
                    }
                )
                continue
            for question in course["questions"]:
                fingerprint = re.sub(r"\s+", " ", fold(question["question"]))[:180]
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
        years.setdefault(year, {"sectionId": SECTION_ID, "year": year, "items": []})
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
            "// Commerciale et Gestion, section 03.\n"
            "// Source: https://www.schoolap.com/exetats/filter?q=&branch=*&option=14\n"
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
            courses = ", ".join(course["course"] for course in item["courses"])
            parts.append(f"{item['type']}={count} [{courses}]")
        print(f"  {year_data['year']}: " + " | ".join(parts))


def main() -> None:
    listings = collect_listings()
    print(f"\nScraping {len(listings)} exam pages...")
    papers: list[dict] = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(scrape_one, row) for row in listings]
        for index, future in enumerate(as_completed(futures), 1):
            paper = future.result()
            if paper:
                papers.append(paper)
                n = sum(len(c["questions"]) for c in paper["courses"])
                print(f"  [{index}/{len(listings)}] {paper['year']} {paper['type']} {n}q")
            else:
                print(f"  [{index}/{len(listings)}] skipped")
    years = merge_papers(papers)
    write_year_files(years)
    summarize(years)


if __name__ == "__main__":
    main()
