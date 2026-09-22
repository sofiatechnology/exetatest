import type { YearSeed } from '../seed-types';

// Commerciale et Gestion, section 03.
// Source: https://www.schoolap.com/exetats/filter?q=&branch=*&option=14
// Schoolap does not publish the correct option, so answer is 0.
const year: YearSeed = {
  "sectionId": "03",
  "year": 2020,
  "items": [
    {
      "type": "co",
      "sources": [
        "https://www.schoolap.com/exetats/626/option/option-s3",
        "https://www.schoolap.com/exetats/623/option/option-s2"
      ],
      "courses": [
        {
          "course": "Éducation civique et morale",
          "passage": null,
          "questions": [
            {
              "question": "Indiquez la nationalité de l'actuel Président en exercice de l'Union Africaine (U.A.).",
              "options": [
                "Portugaise",
                "Espagnole.\n\n.",
                "Brésilienne.",
                "Egyptienne.",
                "Marocaine."
              ],
              "answer": 0
            },
            {
              "question": "Indiquez la dénomination de la formation politique dont le leader est le Directeur de Cabinet de l'actuel Président de la République Démocratique du Congo :",
              "options": [
                "UDPS.",
                "PPRD.",
                "UNC.",
                "PALU.",
                "MLC."
              ],
              "answer": 0
            },
            {
              "question": "Indiquez la dénomination du parti politique dont le leader est le cinquième Président de la République Démocratique du Congo",
              "options": [
                "UDPS.",
                "PPRD.",
                "UNC.",
                "PALU.",
                "MLC."
              ],
              "answer": 0
            }
          ]
        },
        {
          "course": "Pratique professionnelle",
          "passage": null,
          "questions": [
            {
              "question": "La mesure de protection qui permet l'élimination directe du coronavirus est:",
              "options": [
                "Le dépistage.\n\n.",
                "L'usage des désinfectants.",
                "L'usage d'eau sucrée.",
                "La distanciation sociale.",
                "Le confinement."
              ],
              "answer": 0
            },
            {
              "question": "L'Organisation des Nations Unies qui s'occupe essentiellement des problèmes des enfants s'appelle :",
              "options": [
                "PNUD.",
                "PAM.",
                "FAO.",
                "UNICEF.",
                "H.C.R."
              ],
              "answer": 0
            },
            {
              "question": "Le système politique où l'autorité est rattachée par des dignitaires religieux est appelée :",
              "options": [
                "oligarchie.",
                "monarchie absolue.",
                "ploutocratie.",
                "aristocratie.",
                "théocratie"
              ],
              "answer": 0
            },
            {
              "question": "Indiquer la nationalité de l'actuel Secrétaire Général des Nations Unies.",
              "options": [
                "Portugaise.",
                "Espagnole.",
                "Brésilienne.",
                "Egyptienne.",
                "Marocaine."
              ],
              "answer": 0
            },
            {
              "question": "La mesure de protection contre le coronavirus qui préserve des postillons est :",
              "options": [
                "Le dépistage.",
                "L'usage des désinfectants.",
                "L'usage d'eau sucrée.",
                "La distanciation sociale.",
                "Le confinement."
              ],
              "answer": 0
            },
            {
              "question": "L'Organisme des Nations Unies qui s'occupe des problèmes des réfugiés s'appelle:",
              "options": [
                "PNUD.",
                "PAM.",
                "FAO.",
                "UNICEF.",
                "H.C.R"
              ],
              "answer": 0
            },
            {
              "question": "Le système politique où le pouvoir est concentré entre les mains d'un seul individu qui n'a de compte à rendre à personne est appelé",
              "options": [
                "oligarchie.",
                "monarchie absolue.",
                "ploutocratie.",
                "aristocratie.",
                "théocratie"
              ],
              "answer": 0
            }
          ]
        }
      ]
    }
  ]
};

export default year;
