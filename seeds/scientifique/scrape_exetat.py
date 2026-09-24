#!/usr/bin/env python3
"""Scrape Schoolap Scientifique (option 30) into yearly exetat seeds.

Source listing:
https://www.schoolap.com/exetats/filter?q=&branch=*&option=30

Writes one TypeScript file per year in ./exetat/{year}.ts plus ./exetat/index.ts.
Course names come from cours-list.md.
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
CACHE_DIR = Path("/tmp/schoolap-scientifique-cache")
LISTING = "https://www.schoolap.com/exetats/filter?q=&branch={branch}&option=30&page={page}"
SECTION_ID = "02"
OPTION_BADGE = "Scientifique"
SOURCE = "https://www.schoolap.com/exetats/filter?q=&branch=*&option=30"

# Names are the trimmed entries of cours-list.md.
GEOLOGIE = "Géologie"
GEOGRAPHIQUE = "Géographique"
HISTOIRE = "Histoire"
FRANCAIS = "Français"
CHIMIE = "Chimie"
ECM = "Education Civique et Morale"
GEOMETRIE = "Géométrie"
TIC = "Technologie d'information et de communication"
ALGEBRE = "Algèbre"
EDVIE = "Education à la vie et a l'environnement"
PROBABILITE = "Probabilité"
BIOLOGIE = "Biologie"
PHILOSOPHIE = "Philosophie"
DESSIN = "Dessin"
ANGLAIS = "Anglais"
PHYSIQUE = "Physique"

BRANCH_TYPE = {
    "1": "cg",  # culture-generale
    "2": "sc",  # science
    "3": "co",  # option / cours d'option
    "4": "la",  # langue
    "5": "la",  # hors-session (dissertations)
}

TYPE_ORDER = ("cg", "sc", "co", "la")

# Official names from cours-list.md. Keyword lists are accent-insensitive.
COURSE_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        PHILOSOPHIE,
        [
            "syllogisme", "socrate", "platon", "aristote", "kant", "descartes",
            "philosophe", "metaphysique", "ontolog", "dialectique",
            "logique formelle", "maieutique", "empirisme", "rationalisme",
            "sophiste", "epistemolog", "existenti", "concept philosophique",
            "jugement", "proposition categorique", "figure du syllogisme",
        ],
    ),
    (
        EDVIE,
        [
            "education a la vie", "sida", "vih", "ist", "mst", "sexualite",
            "contraception", "puberte", "grossesse", "planning familial",
            "drogue", "tabagisme", "alcoolisme", "paludisme", "vaccin",
            "hygiene", "nutrition", "coronavirus", "covid", "pandemie",
            "biodiversite", "rechauffement", "pollution", "eau potable",
            "dechet", "environnement", "desinfectant", "distanciation",
            "ist ", "preservatif",
        ],
    ),
    (
        ECM,
        [
            "constitution", "pouvoir judiciaire", "pouvoir executif",
            "pouvoir legislatif", "president", "vice-president", "democratie",
            "citoyen", "parlement", "assemblee nationale", "senat", "senateur",
            "gouvernement", "election", "electoral", "suffrage",
            "droits de l'homme", "tribunal", "decret", "ordonnance",
            "souverainete", "premier ministre", "civisme", "referendum",
            "separation des pouvoirs", "cour constitutionnelle",
            "nationalite", "hymne national", "drapeau", "devise",
            "parti politique", "union africaine", "nepad", "charte",
            "loi fondamentale", "onu", "unicef", "unesco", "fao", "pam",
            "pnud", "nations unies", "forces armees", "integrite du territoire",
            "legislature", "republique democratique", "institution politique",
            "monarchie", "oligarchie", "ploutocratie", "aristocratie",
            "refugie", "organisation des nations",
        ],
    ),
    (
        HISTOIRE,
        [
            "independance", "colonisation", "colonie", "leopold", "lumumba",
            "mobutu", "kasa-vubu", "conference de berlin", "traite negriere",
            "royaume kongo", "empire", "revolution", "bataille", "antiquite",
            "prehistoire", "stanley", "livingstone", "etat independant",
            "resistance", "explorateur", "esclavage", "deuxieme guerre",
            "premiere guerre", "hitler", "colonisation belge",
        ],
    ),
    (
        GEOGRAPHIQUE,
        [
            "geographie", "geographique", "fleuve", "relief", "latitude",
            "longitude", "equateur", "desert", "foret equatoriale",
            "hydrograph", "vegetation", "cuivre", "cobalt", "coltan",
            "diamant", "pluviometrie", "savane", "altitude", "bassin",
            "province", "kinshasa", "lubumbashi", "kisangani", "estuaire",
            "saison seche", "saison des pluies", "densite de la population",
            "natalite", "exode rural", "frontiere", "ocean", "lac tanganyika",
            "lac kivu", "climat", "minerai", "sous-sol", "culture vivriere",
            "port d'escale", "massif", "hydroelectricite",
        ],
    ),
    (
        GEOLOGIE,
        [
            "geologie", "geologique", "roche", "magma", "fossile", "strate",
            "granite", "basalte", "schiste", "calcaire", "seisme",
            "tectonique", "cristal", "mineralogie", "sediment", "faille",
            "volcan", "lithosph", "croute terrestre", "ere primaire",
            "ere secondaire", "paleozo", "houille", "petrograph",
            "roche magmatique", "roche sedimentaire", "roche metamorphique",
        ],
    ),
    (
        TIC,
        [
            "informatique", "ordinateur", "logiciel", "internet", "clavier",
            "windows", "excel", "processeur", "memoire vive", "tableur",
            "navigateur", "algorithme", "binaire", "reseau informatique",
            "systeme d'exploitation", "wifi", "fichier informatique",
            "technologie de l'information", "technologie d'information",
        ],
    ),
    (
        DESSIN,
        [
            "dessin", "croquis", "esquisse", "perspective", "hachure",
            "cotation", "projection orthogonale", "vue de face",
            "vue de dessus", "trait continu", "echelle du dessin",
        ],
    ),
    (
        PROBABILITE,
        [
            "probabilite", "arrangement", "combinaison", "permutation",
            "nombre de possibilites", "evenement", "esperance", "variance",
            "loi binomiale", "factorielle", "tirage au sort", "urne",
            "possibilites d'affecter", "nombre de facons",
        ],
    ),
    (
        GEOMETRIE,
        [
            "geometrie", "triangle", "cercle", "vecteur", "pythagore",
            "parallelogramme", "perpendiculaire", "homothetie", "barycentre",
            "produit scalaire", "theoreme de thales", "polygone", "aire du",
            "volume du", "losange", "trapeze",
            "sphere", "cylindre", "cone", "pyramide", "mediatrice",
            "bissectrice", "droite (d)", "plan affine",
        ],
    ),
    (
        ALGEBRE,
        [
            "algebre", "fonction", "limite", "asymptote", "logarithme",
            "equation", "inequation", "polynome", "derivee", "integrale",
            "continuite", "nombre complexe", "matrice", "suite numerique",
            "racine de l'equation", "domaine de definition", "reciproque",
            "log ", "courbe representative", "variation de la fonction",
        ],
    ),
    (
        PHYSIQUE,
        [
            "physique", "volt", "newton", "tesla", "ohm", "ampere", "watt",
            "joule", "bobine", "resistance", "resistivite", "circuit",
            "lentille", "miroir", "dioptre", "pendule", "cinematique",
            "acceleration", "force de repulsion", "charges ponctuelles",
            "d.d.p", "difference de potentiel", "champ magnetique",
            "flux magnetique", "spire", "condensateur", "intensite du courant",
            "coup de foudre", "frequence", "longueur d'onde", "refraction",
            "pascal", "pression atmospherique",
        ],
    ),
    (
        CHIMIE,
        [
            "chimie", "chimiste", "acide", "hydroxyde", "solution", "mole",
            "molaire", "ph ", "titrage", "redox", "oxydation", "permanganate",
            "normalite", "centinormale", "decinormale", "equivalent-gramme",
            "equation chimique", "atome", "noyau", "radioactiv", "nucleide",
            "electron", "proton", "neutron", "orbitale", "molecul",
            "concentration", "precipit", "chlorure", "acide sulfurique",
            "acide nitrique", "acide phosphorique", "gillespie", "liaison",
            "tableau periodique", "electrolyse", "electrolytique",
            "electrovalence", "potentiel redox", "base faible", "solute",
            "alliage", "dioxyde", "chlore", "periode de",
        ],
    ),
    (
        BIOLOGIE,
        [
            "biologie", "cellule", "chromosome", "mitose", "mitotique",
            "meiose", "embryon", "zygote", "phenotype", "genotype", "hybride",
            "nucleotide", "adn", "arn", "photosynthese", "globule", "bacterie",
            "virus", "hormone", "ecosysteme", "chlorophylle", "evolution",
            "mendel", "enzyme", "proteine", "immunite", "anticorps",
            "fecondation", "ovule", "spermatozoide", "genetique", "mutation",
            "caryotype", "organite", "mitochondrie", "allele",
            "selection naturelle", "spermatogenese", "hemophilie", "biosphere",
            "chloroplaste", "cytoplasme", "homozygote", "heterozygote",
            "facteur ecologique", "reproduction asexuee", "gemmiparite",
            "scissiparite", "centriole", "prophase", "metaphase", "anaphase",
            "telophase", "gonie", "lombric", "hydre",
        ],
    ),
    (
        ANGLAIS,
        [
            "english text", "according to the text", "the word",
            "which of the following", "vowel sound", "synonym",
            "questions based on the text", "means:",
        ],
    ),
    (
        FRANCAIS,
        [
            "texte francais", "dissertation", "participe passe", "subordonnee",
            "orthographe", "grammaire", "accord du", "figure de style",
            "question sur le texte", "nature grammaticale", "fonction grammaticale",
            "proposition subordonnee",
        ],
    ),
]

HEADER_COURSE = [
    ("english text", ANGLAIS),
    ("questions based on the text", ANGLAIS),
    ("texte francais", FRANCAIS),
    ("texte français", FRANCAIS),
    ("question sur le texte", FRANCAIS),
    ("questions sur le texte", FRANCAIS),
    ("questions hors-texte", FRANCAIS),
    ("questions hors texte", FRANCAIS),
    ("french text", FRANCAIS),
    ("texte de francais", FRANCAIS),
    ("dissertation", FRANCAIS),
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
    "dissertation",
}

FALLBACK = {
    "cg": ECM,
    "sc": BIOLOGIE,
    "co": BIOLOGIE,
    "la": FRANCAIS,
}

PREFERRED = {
    "cg": {GEOGRAPHIQUE, HISTOIRE, ECM, EDVIE, PHILOSOPHIE, TIC, DESSIN},
    "sc": {BIOLOGIE, CHIMIE, PHYSIQUE, GEOLOGIE, ALGEBRE, GEOMETRIE, PROBABILITE},
    "co": {
        CHIMIE, PHYSIQUE, BIOLOGIE, GEOLOGIE, ALGEBRE, GEOMETRIE,
        PROBABILITE, DESSIN, TIC,
    },
    "la": {ANGLAIS, FRANCAIS},
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
MARKER_RE = re.compile(
    r"questions?\s+based\s+on\s+the\s+text|questions?\s+sur\s+le\s+texte|questions?\s+hors[-\s]?texte",
    re.I,
)


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
            print(f"listing {item_type} branch {branch} page {page}", flush=True)
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
    url = row["url"].lower()
    title = fold(row.get("title") or "")
    if "/culture-generale/" in url or "culture" in title:
        return "cg"
    if "/science/" in url or title in {"science", "sciences"}:
        return "sc"
    if "/option/" in url or title in {"option", "chimie", "physique", "biologie"}:
        return "co"
    if (
        "/langue/" in url
        or "langue" in title
        or "dissertation" in title
        or "anglais" in title
        or "francais" in title
    ):
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
    return (
        re.search(
            rf"(?<![a-z0-9]){re.escape(needle)}s?(?![a-z0-9])",
            folded,
        )
        is not None
    )


def course_from_headers(text: str, item_type: str) -> str | None:
    folded = fold(text)
    for needle, course in HEADER_COURSE:
        if needle not in folded:
            continue
        if course in (ANGLAIS, FRANCAIS) and item_type != "la":
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
            return ANGLAIS, 1
        return FRANCAIS, 1
    if best_score == 0 and item_type in ("sc", "co"):
        if re.search(r"probabilit|arrangement|combinaison|permutation|possibilit", folded):
            return PROBABILITE, 1
        if re.search(r"triangle|cercle|vecteur|pythagore|parallelogramme|homothetie", folded):
            return GEOMETRIE, 1
        if re.search(
            r"f\s*\(\s*x\s*\)|limite|asymptote|logarithme|\blog\b|equation|continuite|polynome|derivee|integrale",
            folded,
        ):
            return ALGEBRE, 1
        if re.search(r"acide|chimiste|\bph\b|permanganate|titrage|molecul|radioactiv", folded):
            return CHIMIE, 1
        if re.search(r"volt|newton|tesla|ohm|ampere|bobine|resistiv|lentille|miroir|foudre", folded):
            return PHYSIQUE, 1
        if re.search(r"roche|magma|fossile|geolog|strate|seisme", folded):
            return GEOLOGIE, 1
        return BIOLOGIE, 1
    if best_score == 0 and item_type == "cg":
        if re.search(r"syllogisme|philosophe|socrate|kant|descartes", folded):
            return PHILOSOPHIE, 1
        if re.search(r"coronavirus|covid|sida|vih|paludisme|vaccin|environnement", folded):
            return EDVIE, 1
        if re.search(r"colonie|royaume|independance|explorateur|bataille|prehistor", folded):
            return HISTOIRE, 1
        if re.search(r"fleuve|relief|latitude|geograph|province|climat|population", folded):
            return GEOGRAPHIQUE, 1
        if re.search(r"election|constitution|pouvoir|citoyen|parlement|nations unies|president", folded):
            return ECM, 1
        return ECM, 1
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

        if header_course and header_course in PREFERRED[item_type]:
            course = header_course
            used_passage = current_passage if item_type == "la" else None
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
            "// Scientifique, section 02.\n"
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

    print("\nSamples")
    shown: set[tuple[str, str]] = set()
    for year_data in years:
        for item in year_data["items"]:
            for course in item["courses"]:
                key = (item["type"], course["course"])
                if key in shown:
                    continue
                shown.add(key)
                sample = course["questions"][0]["question"][:140]
                print(f"  {item['type']} / {course['course']}: {sample}")


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
