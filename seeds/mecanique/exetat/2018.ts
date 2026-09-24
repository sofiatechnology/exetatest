import type { YearSeed } from '../seed-types';

// Mécanique, section 05.
// Source: https://www.schoolap.com/exetats/filter?q=&branch=*&option=12
// Schoolap does not publish the correct option, so answer is 0.
const year: YearSeed = {
  "sectionId": "05",
  "year": 2018,
  "items": [
    {
      "type": "cg",
      "sources": [
        "https://www.schoolap.com/exetats/48/culture-generale/culture-generale"
      ],
      "courses": [
        {
          "course": "Actualités",
          "passage": null,
          "questions": [
            {
              "question": "Indiquez la première femme candidate aux présidentielles des USA.",
              "options": [
                "Angela Merckel.",
                "Conoleaza Rice.",
                "Hillary Clinton.",
                "Marine Le PEN.",
                "Ségolène Royal."
              ],
              "answer": 0
            },
            {
              "question": "Indiquez le nom et la nationalité du lauréat Prix Nobel de paix 2016.",
              "options": [
                "Barack Obama- Américaine.",
                "Hellen Sirleaf Johnson- Libérienne.",
                "Juan Manuel Santos - Colombienne.",
                "Koffi Annan- Ghanéenne.",
                "MALALA Yousafzai - Pakystanaise."
              ],
              "answer": 0
            },
            {
              "question": "Indiquez le nom et la nationalité de l’actuel Secrétaire Général de l’ONU.",
              "options": [
                "Antonio Guturres - Portugaise.",
                "Ban Ki-Moon - Sud coréenne.",
                "Bourtros Boutros- Ghali - Égyptienne.",
                "Pascal Terasse - Française.",
                "Sépare Senghor L. - Sénégalaise."
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
              "question": "Indiquez l’organe exécutif de l’Union Africaine (UA).",
              "options": [
                "Conférence des ministres.",
                "Commission.",
                "Conseil exécutif.",
                "Cour de justice.",
                "Parlement africain."
              ],
              "answer": 0
            },
            {
              "question": "La Défense d’ivoire représentée sur l’emblème de notre pays symbolise:",
              "options": [
                "La paix et l’avenir radieux du pays.",
                "La protection des intérêts et de l’intégrité du pays.",
                "Le pouvoir et les valeurs du pays.",
                "La puissance des forces combattantes du pays.",
                "Les richesses naturelles du pays."
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
