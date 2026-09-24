import type { YearSeed } from '../seed-types';

// Scientifique, section 02.
// Source: https://www.schoolap.com/exetats/filter?q=&branch=*&option=30
// Schoolap does not publish the correct option, so answer is 0.
const year: YearSeed = {
  "sectionId": "02",
  "year": 2021,
  "items": [
    {
      "type": "cg",
      "sources": [
        "https://www.schoolap.com/exetats/509/culture-generale/culture-generale-s2"
      ],
      "courses": [
        {
          "course": "Education Civique et Morale",
          "passage": null,
          "questions": [
            {
              "question": "L'actuel 1 er Vice-Président de l'Assemblée Nationale est:",
              "options": [
                "Jean Marc KABUND",
                "Christophe MBOSO NKODIA",
                "Emmanuel SHADARI",
                "Colette TSHOMBA",
                "Augustin KABUYA"
              ],
              "answer": 0
            },
            {
              "question": "Indiquez le nom du leader de la plateforme \"Ensemble pour le changement\".",
              "options": [
                "Alexis THAMBWE MWAMBA",
                "Jean-Pierre BEMBA",
                "Martin FAYULU",
                "Modeste BAHATI LUKWEBO",
                "Moise KATUMBI"
              ],
              "answer": 0
            },
            {
              "question": "La lutte menée par Etienne TSHISEKEDI WA MULUMBA avait pour socle de la plateforme dite \"L'union sacrée.....:",
              "options": [
                "de la nation",
                "pour la nation",
                "à la nation",
                "de l'opposition",
                "avec la nation"
              ],
              "answer": 0
            },
            {
              "question": "Les forces armées de la R.D.C ont pour mission fondamentale de :",
              "options": [
                "garantir les libertés individuelles des citoyens",
                "défendre l'intégrité du Territoire national",
                "maintenir et rétablir l'ordre public",
                "former et encadrer les enfants des rues",
                "juger les infractions à caractère politique"
              ],
              "answer": 0
            },
            {
              "question": "Le premier ministre assure l'exécution des lois, dispose du pouvoir réglementaire et statue par voie de :",
              "options": [
                "la constitution",
                "la charte",
                "la circulaire",
                "l'arrêté",
                "le décret"
              ],
              "answer": 0
            }
          ]
        }
      ]
    },
    {
      "type": "co",
      "sources": [
        "https://www.schoolap.com/exetats/594/option/option"
      ],
      "courses": [
        {
          "course": "Biologie",
          "passage": null,
          "questions": [
            {
              "question": "En génétique, le descendant du croisement des deux individus appartenant à deux espèces différentes est appelé :",
              "options": [
                "allèle",
                "hétérozygote",
                "homozygote",
                "hybride",
                "gène"
              ],
              "answer": 0
            },
            {
              "question": "Indiquez le nombre de spermatozoïdes produits par 3 gonies après 2 mois :",
              "options": [
                "64",
                "48",
                "32",
                "16",
                "8"
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
