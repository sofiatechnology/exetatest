import type { YearSeed } from '../seed-types';

// Hôtellerie et Restauration, section 09.
// Source: https://www.schoolap.com/exetats/filter?q=&branch=*&option=27
// Schoolap does not publish the correct option, so answer is 0.
const year: YearSeed = {
  "sectionId": "09",
  "year": 2020,
  "items": [
    {
      "type": "cg",
      "sources": [
        "https://www.schoolap.com/exetats/537/culture-generale/actualite-serie-a"
      ],
      "courses": [
        {
          "course": "Histoire",
          "passage": null,
          "questions": [
            {
              "question": "Indiquez la nationalité de l'actuel Secrétaire Général des Nations Unies.",
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
              "question": "L'organisme des Nations Unies qui s'occupe des problèmes des réfugiés s'appelle:",
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
              "question": "Indiquez la dénomination du parti politique dont le leader est le cinquième Président de la République Démocratique du Congo:",
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
          "course": "Éducation à la vie",
          "passage": null,
          "questions": [
            {
              "question": "La mesure de protection contre le coronavirus qui présente des postillons est:",
              "options": [
                "Le dépistage.",
                "L'usage des désinfectants.",
                "L'usage d'eau sucrée.",
                "La distanciation sociale.",
                "Le confinement."
              ],
              "answer": 0
            }
          ]
        },
        {
          "course": "Éducation civique et morale",
          "passage": null,
          "questions": [
            {
              "question": "Le système politique où le pouvoir est concentré entre les mains d'un seul individu qui n'a pas de compte à rendre à personne est appelé:",
              "options": [
                "Oligarchie.",
                "Monarchie absolue.",
                "Ploutocratie.",
                "Aristocratie.",
                "Théocratie."
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
