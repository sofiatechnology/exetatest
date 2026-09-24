#!/usr/bin/env python3
"""Scrape Schoolap Latin Philo (option 10) into yearly exetat seeds.

Source listing:
https://www.schoolap.com/exetats/filter?q=&branch=*&option=10

Writes one TypeScript file per year in ./exetat/{year}.ts plus ./exetat/index.ts.
Course names come from cours-list.md (bulletin Latin-Philo).
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
CACHE_DIR = Path("/tmp/schoolap-latin-philo-cache")
LISTING = "https://www.schoolap.com/exetats/filter?q=&branch={branch}&option=10&page={page}"
SECTION_ID = "01"
OPTION_BADGE = "Latin Philo"
SOURCE = "https://www.schoolap.com/exetats/filter?q=&branch=*&option=10"

BRANCH_TYPE = {
    "1": "cg",
    "2": "sc",
    "3": "co",
    "4": "la",
}

TYPE_ORDER = ("cg", "sc", "co", "la")

# Official names from cours-list.md. Keyword lists are accent-insensitive.
COURSE_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        "Religion",
        [
            "bible", "eglise", "dieu", "jesus", "islam", "coran", "priere",
            "religion", "catholique", "protestant", "pentecote", "adventiste",
            "moise", "eveque", "sacrement", "prophete", "mosquee", "synagogue",
            "eucharistie", "bapteme", "ramadan", "pasteur", "vatican", "pape",
            "mahomet", "allah", "commandement", "ancien testament",
            "nouveau testament", "foi religieuse", "culte", "catechisme",
            "evangile", "parabole",
        ],
    ),
    (
        "Éducation à la vie",
        [
            "education a la vie", "sida", "vih", "ist", "mst", "sexualite",
            "contraception", "puberte", "grossesse", "planning familial",
            "drogue", "tabagisme", "alcoolisme", "paludisme", "vaccin",
            "nutrition", "hygiene corporelle", "ist",
        ],
    ),
    (
        "Éducation civique et morale",
        [
            "constitution", "pouvoir judiciaire", "pouvoir executif",
            "pouvoir legislatif", "president de la republique", "democratie",
            "citoyen", "parlement", "assemblee nationale", "senat",
            "gouvernement", "election", "electoral", "suffrage", "bulletin",
            "droits de l'homme", "tribunal", "decret", "ordonnance",
            "souverainete", "premier ministre", "civisme", "referendum",
            "separation des pouvoirs", "cour constitutionnelle",
            "cour de cassation", "nationalite", "hymne national", "drapeau",
            "devise", "parti politique", "partis politiques", "union africaine",
            "nepad", "charte", "loi fondamentale", "onu", "union europeenne",
            "institution judiciaire", "operations electorales",
            "nations unies", "organisation internationale",
            "organisation africaine", "integration africaine",
            "organisation d'integration", "otan", "ceca",
        ],
    ),
    (
        "Informatique",
        [
            "informatique", "ordinateur", "logiciel", "internet", "clavier",
            "windows", "excel", "processeur", "memoire vive", "tableur",
            "navigateur", "algorithme", "binaire", "fichier informatique",
            "systeme d'exploitation",
        ],
    ),
    (
        "Biologie",
        [
            "cellule", "chromosome", "mitose", "meiose", "embryon", "zygote",
            "phenotype", "genotype", "hybride", "nucleotide", "adn", "arn",
            "photosynthese", "globule", "bacterie", "virus", "hormone",
            "ecosysteme", "chlorophylle", "evolution", "mendel", "pedigree",
            "pedigree", "enzyme", "proteine", "immunite", "anticorps",
            "fecondation", "ovule", "spermatozoide", "genetique", "mutation",
            "caryotype", "organite", "mitochondrie", "allele",
            "selection naturelle", "spermatogenese", "hemophilie", "biosphere",
            "paleontologue", "telophase", "cobaye", "plumage", "pelage",
            "ere secondaire", "facteurs ecologiques",
            "chloroplaste", "cytoplasme", "noyau cellulaire",
            "effet de serre", "amphibien", "homozygote", "heterozygote",
            "nidation", "chromosomique", "rechauffement climatique",
        ],
    ),
    (
        "Éducation physique",
        [
            "education physique", "athletisme", "gymnastique", "echauffement",
            "natation", "football", "basket-ball", "basketball", "olympique",
            "sportif", "sportive", "volley", "handball", "sprint", "endurance",
            "jeu sportif", "arbitre",
        ],
    ),
    (
        "Géographie",
        [
            "relief", "minerai", "fleuve", "climat", "geographie",
            "hydrograph", "vegetation", "cuivre", "cobalt", "latitude",
            "longitude", "equateur", "desert", "foret equatoriale",
            "bassin", "erosion", "savane", "altitude", "pluviometrie",
            "coltan", "diamant", "frontiere", "estuaire", "saison seche",
            "massif", "montagne", "volcan", "lac tanganyika", "lac kivu",
            "ocean", "densite de la population", "natalite", "exode rural",
            "gisement", "sous-sol", "population", "carte muette",
            "maghreb", "voie de communication", "economie congolaise",
            "touriste", "logistique", "gisement minier", "cap nord",
            "contrainte naturelle", "port d'escale", "port sur",
            "route nationale", "groupe ethnique", "ethnie", "pygmee",
            "nilotique", "soudanais", "localite", "detroit", "isthme",
            "meridional", "agriculture", "elevage",
        ],
    ),
    (
        "Histoire",
        [
            "independance", "colonisation", "colonie", "leopold", "lumumba",
            "mobutu", "kasa-vubu", "conference de berlin", "royaume",
            "empire", "revolution", "bataille", "antiquite", "prehistoire",
            "stanley", "livingstone", "etat independant", "esclavage",
            "guerre mondiale", "explorateur", "protectorat",
            "conquete coloniale", "royaume kongo", "moyen age",
            "partition de l'afrique", "hominisation", "lithique",
            "paleolithique", "denomination coloniale", "decolonisation",
            "science auxiliaire", "homme prehistorique", "souverain",
            "tshisekedi", "resistance", "critique dite", "critique historique",
            "bipede", "dentition", "langage articule", "chef africain",
            "missionnaire", "evangelisation", "congo belge", "fossile",
            "neandertal", "cro-magnon",
        ],
    ),
    (
        "Mathématiques",
        [
            "fonction f", "f(x)", "equation", "derivee", "integrale",
            "vecteur", "probabilite", "polynome", "intervalle",
            "courbe representative", "logarithme", "sinus", "cosinus",
            "asymptote", "inequation", "discriminant", "limite",
            "domaine de definition", "nombre derive", "cotg", "tangente",
            "centre de symetrie", "coefficient angulaire",
        ],
    ),
    (
        "Philosophie",
        [
            "philosophie", "philosophe", "socrate", "platon", "aristote",
            "descartes", "kant", "nietzsche", "hegel", "existentialisme",
            "existantialiste", "metaphysique", "epistemologie",
            "rationalisme", "empirisme", "stoicisme", "dialectique",
            "cogito", "sophiste", "syllogisme", "carre logique",
            "gabriel marcel", "premisse", "acte volontaire", "sensation",
            "habitude", "bergson", "sartre", "heidegger", "contrariete",
            "apulee", "logique", "psychologique", "psychologie",
            "aphorisme", "syllogistique", "subalterne", "sub-contraire",
            "ontologique", "verite mathematique", "figure logique",
        ],
    ),
    (
        "Physique",
        [
            "newton", "joule", "volt", "ampere", "ohm", "watt", "lentille",
            "pesanteur", "refraction", "radioactivite", "chute libre",
            "energie cinetique", "champ magnetique", "longueur d'onde",
            "masse volumique", "condensateur", "transformateur",
            "pression atmospherique", "optique", "photon", "electron",
            "acceleration", "mouvement rectiligne", "electricite",
            "pendule", "frottement", "rendement", "nucleaire",
            "megawatt", "m/s", "machine a vapeur", "flux d'induction",
            "puissance", "decoller", "piste de", "energie",
            "plan incline", "travail",
        ],
    ),
    (
        "Latin",
        [
            "ablatif", "accusatif", "genitif", "datif", "nominatif",
            "vocatif", "declinaison", "conjugaison", "subjonctif",
            "gerondif", "supin", "ablatif absolu", "ciceron", "cesar",
            "virgile", "tacite", "salluste", "ovide", "horace", "seneque",
            "catulle", "texte latin", "en latin", "traduisez",
            "cas et la fonction", "proposition infinitive", "langue latine",
            "romain", "romaine", "quidam", "gallia", "imperium", "senatus",
            "germain", "germains", "orbitatis",
        ],
    ),
    (
        "Anglais",
        [
            "english text", "questions based on the text", "the word",
            "which of the following", "the missing word", "paragraph",
            "synonym", "stressed", "missing words",
        ],
    ),
    (
        "Français",
        [
            "texte francais", "participe passe", "subordonnee", "orthographe",
            "grammaire", "accord du", "proposition subordonnee",
            "figure de style", "question sur le texte", "indiquez le mot",
            "hors-texte", "hors texte", "nature grammaticale",
        ],
    ),
]

HEADER_COURSE = [
    ("english text", "Anglais"),
    ("questions based on the text", "Anglais"),
    ("texte francais", "Français"),
    ("texte français", "Français"),
    ("question sur le texte", "Français"),
    ("questions sur le texte", "Français"),
    ("questions hors-texte", "Français"),
    ("questions hors texte", "Français"),
    ("french text", "Français"),
    ("texte latin", "Latin"),
]

SECTION_HEADERS = {
    "english text",
    "questions based on the text",
    "texte francais",
    "texte français",
    "question sur le texte",
    "questions sur le texte",
    "questions hors-texte",
    "questions hors texte",
    "french text",
    "texte de francais",
    "texte latin",
}

FALLBACK = {
    "cg": "Géographie",
    "sc": "Biologie",
    "co": "Latin",
    "la": "Français",
}

PREFERRED = {
    "cg": {
        "Religion",
        "Éducation à la vie",
        "Éducation civique et morale",
        "Informatique",
        "Éducation physique",
        "Géographie",
        "Histoire",
        "Philosophie",
    },
    "sc": {
        "Biologie",
        "Mathématiques",
        "Physique",
    },
    "co": {
        "Latin",
        "Philosophie",
    },
    "la": {
        "Anglais",
        "Français",
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


MARKER_RE = re.compile(
    r"questions?\s+based\s+on\s+the\s+text|questions?\s+sur\s+le\s+texte|questions?\s+hors[-\s]?texte",
    re.I,
)


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
        misses = 0
        while page <= 40:
            url = LISTING.format(branch=branch, page=page)
            print(f"listing {item_type} page {page}", flush=True)
            try:
                page_html = fetch(url)
            except Exception as exc:  # noqa: BLE001
                misses += 1
                print(f"  listing failed ({misses}): {exc}", flush=True)
                if misses >= 3:
                    break
                continue
            rows = parse_listing(page_html)
            fresh = 0
            for row in rows:
                row["type"] = item_type
                if row["url"] not in found:
                    found[row["url"]] = row
                    fresh += 1
            print(f"  cards={len(rows)} new={fresh}", flush=True)
            if fresh == 0 or len(rows) == 0:
                break
            misses = 0
            page += 1
            time.sleep(0.25)
    return list(found.values())


def resolve_type(row: dict) -> str | None:
    """Keep the Schoolap branch, and correct papers filed under the wrong branch."""
    title = fold(row.get("title") or "")
    if "comptabil" in title:
        return None
    if "latin" in title:
        return "co"
    if any(word in title for word in ("science", "biologie", "mathematique", "physique")):
        return "sc"
    if "culture" in title or title.startswith("histoire"):
        return "cg"
    if any(word in title for word in ("langue", "anglais", "francais", "dissertation")):
        return "la"
    return row["type"]


def is_header(text: str) -> bool:
    folded = fold(text).strip(" .:-")
    if folded in SECTION_HEADERS:
        return True
    return folded.startswith("texte ") and len(folded) < 24


def contains_term(folded: str, needle: str) -> bool:
    if needle.endswith(" "):
        return needle in folded
    # Allow a trailing plural s so "joule" matches "joules" and "allele" matches "alleles".
    return (
        re.search(
            rf"(?<![a-z0-9]){re.escape(needle)}s?(?![a-z0-9])",
            folded,
        )
        is not None
    )


def course_from_headers(text: str, item_type: str) -> str | None:
    folded = fold(text)
    if item_type == "co" and re.search(r"\btexte\s+\d", folded):
        return "Latin"
    for needle, course in HEADER_COURSE:
        if needle not in folded:
            continue
        if course == "Latin" and item_type != "co":
            continue
        if course in ("Anglais", "Français") and item_type != "la":
            continue
        return course
    return None


def score_course(text: str, item_type: str) -> tuple[str | None, int]:
    folded = fold(text)
    allowed = PREFERRED[item_type]
    best_name = FALLBACK[item_type]
    best_score = 0
    for name, words in COURSE_KEYWORDS:
        if name not in allowed:
            continue
        score = 0
        for word in words:
            if contains_term(folded, word):
                score += 3 + min(len(word), 32) // 5
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
        if english_hits > french_hits + 1:
            return "Anglais", 1
        return "Français", 1
    if best_score == 0 and item_type == "sc":
        if re.search(
            r"f\s*\(\s*x\s*\)|\\frac|\\lim|asymptote|intervalle|equation|nombre complexe|coordonnee",
            folded,
        ):
            return "Mathématiques", 1
        if re.search(r"\b(volt|newton|joule|watt|m/s|ampere|ohm|diapason|celerite)\b", folded):
            return "Physique", 1
        return None, 0
    if best_score == 0 and item_type == "cg":
        if re.search(r"\b(syllogisme|syllogistique|philosophe|socrate|kant|marcel|ontologique)\b", folded):
            return "Philosophie", 1
        if re.search(r"\b(election|constitution|pouvoir|citoyen|parlement|nations unies)\b", folded):
            return "Éducation civique et morale", 1
        if re.search(r"\b(colonie|royaume|independance|explorateur|bataille|resistance|prehistor)\b", folded):
            return "Histoire", 1
        return "Géographie", 1
    if best_score == 0 and item_type == "co":
        if re.search(r"\b(syllogisme|philosophe|socrate|kant)\b", folded):
            return "Philosophie", 1
        return "Latin", 1
    return best_name, best_score


def is_garbage(text: str) -> bool:
    folded = fold(text)
    if "mso-style" in folded or "msonormaltable" in folded:
        return True
    if "style definitions" in folded:
        return True
    return False


def clean_option(value: str) -> str:
    text = strip_html(value)
    text = re.sub(r"^[1-5]\.\s+", "", text).strip()
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
        questions.append(
            {
                "paragraphs": paras,
                "full": "\n".join(paras),
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
        if is_garbage(full):
            continue
        header_course = course_from_headers(full, item_type)
        if item_type in ("la", "co"):
            question, passage = prompt_and_passage(raw["paragraphs"])
        else:
            question = clean_question(" ".join(raw["paragraphs"]))
            passage = None
        question = clean_question(question)

        if item_type == "la" and header_course in ("Anglais", "Français"):
            current_course = header_course
            if passage:
                current_passage = passage
        elif item_type == "la" and current_course and header_course is None:
            header_course = current_course
        elif item_type == "co" and (header_course == "Latin" or passage):
            current_course = "Latin"
            header_course = "Latin"
            if passage:
                current_passage = passage
        elif item_type == "co" and current_course == "Latin" and header_course is None:
            header_course = "Latin"

        if not question or len(question) < 8 or is_garbage(question):
            continue

        if header_course and header_course in PREFERRED[item_type]:
            course = header_course
            used_passage = current_passage if item_type in ("la", "co") else None
        else:
            course, _score = score_course(
                full + "\n" + " ".join(raw["options"]),
                item_type,
            )
            if course is None:
                continue
            used_passage = None
            if item_type == "la" and course == current_course:
                used_passage = current_passage
            if item_type == "co" and course == "Latin":
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
            "// Latin-Philo, section 01.\n"
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
                    f"  [{done}/{len(listings)}] {paper['year']} {paper['type']} {n}q",
                    flush=True,
                )
            else:
                print(f"  [{done}/{len(listings)}] skipped", flush=True)
    years = merge_papers(papers)
    write_year_files(years)
    summarize(years)


if __name__ == "__main__":
    main()
