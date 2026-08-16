import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item, ItemTypeEnum } from 'src/models/item.model';
import { ItemCourse } from 'src/models/item-course.model';
import { ItemQuestion } from 'src/models/item-question.model';

const SCIENTIFIQUE_SECTION_ID = '02';

// English text passage
const ENGLISH_PASSAGE =
  "Education is the single best investment nations can make to build prosperous, healthy and equitable societies. Education gives hope and confidence in the future. It sets people on a path towards fulfilling ones dreams. Gouvernements have to give hope to those who know « educational » today – the 61 million childre who are out of shcool, the hundreds of millions who lack opportunities for quality leaning. They are 715 million adults in the word who cannot read and write.\nThe parents livings in places recovering from war or natural disaster want their children back in school.they understand that this is the basic building block of every society.\nEducation in facing a crisis. There is a « learning deficit » of those in and out school – that poses huge challenges for suitable development. This is of great concern. The total number of children and youth out of primary and lower secondary shool make 131 million. They could make the tenth largest contry on on earth if concentrated in one location.\nSub – Saharan Africa accounts for half of the world's total out of shool. What is more wprrying is that, according to recent data released by UNESCO, there are more children out of shool in sub – Saharam Africa today than today than three years ago. Nevertheless Africa has made progress since 2000. Enrolment has increased and the gender parity gap has narrowed. In the DEmocratic Republic of Congo the policy « girls and boys all to school » is an answer to stimulate the parents and help the children to love going to school.\nThe growing number of sucess stories across Africa indicates that progress in attainable. They bring the dividends of investing in education. So there must be a new initiative : « Education first », to put education at the heart of the social, political and development agenda. Education first will focus on three areas : putting every in school, improving the quality of learning and fostering global citizenship.\nEducation provides far more than an entry point for the job market ; education brings shared values to life. Education can help us live together by promoting mutual understanding, tolerance and respect. It is also a pathway towards living in harmony with our planet and those we share it with.";

// French text passage
const FRENCH_PASSAGE =
  "La sécurité alimentaire est un élément essentiel pour accroître le bien – être des pauvres à la campagne en ville. Cette sécurité dépend de l'existence des denrées alimentaires et de la possibilité de s'en procurer, du point de vue des transports vers le marché et aussi du pouvoir d'achat des consommateurs, qui dépendent eux- mêmes du succès des stages visant à accroitre les moyens de subsistance des ménages. Même si la sécurité alimentaire semble être essentiellement une question agricole, une politique industrielle basée essentiellement sur le renforcement des liens entre l'industrie et l'agriculture pourrait largement contribuer à la stimuler.\nEn Afrique, 10 à 15 pour cent seulement de la production alimentaire sont transformés, le pourcentage correspondant dans le pays développés à économie de marché étant de 80 pour cent. Un degré plus élevé de transformation contribuerait à la sécurité alimentaire, comme le ferait aussi l'amélioration des installations de stockage ou une augmentation de la production d'intrants agricoles, surtout si les systèmes de commercialisation de denrées alimentaires étaient en même temps renforcés.\nTout examen de l'offre des denrées alimentaires en Afrique soulevé la question de la productivité agricole. Accroitre cette productivité devrait être l'un des objectifs de la politique industrielle, ce qui serait possible en fournissant aux agriculteurs des intrants agricoles tels que des engrais, et des biens de consommation à titre de mesure d'encouragement pour les inciter à augmenter leur production. Etant donné l'importance de l'agriculture dans le PIB et ses liens potentiels avec d'autres secteurs une augmentation de la productivité agricole constituerait un stimulant appréciable pour propager la croissance et l'emploi. Les emplois hors agricultures, fournissant des sources de revenus diversifiés, peuvent contribuer à une augmentation durable des revenus et à la sécurité alimentaire. L'industrialisation des campagnes a été rendue célèbre par les « entreprises communales et villageoises » de chine entre 1978 et le milieu des années 80. Ces réformes qui se concentraient sur la « de collectivisation », ont fait monter les revenus de la paysanne et entrainé une augmentation du pouvoir d'achat, engendrant ainsi des fonds à investir dans l'industrie rurale. Les reformes agricoles ont par ailleurs libéré une main-d'œuvre excédentaire pour les emplois hors agriculture. En 1993, les entreprises communales et villageoises de chine représentaient plus de 40 pour cent des exportations agricole en recourant aux technologies de la « révolution verte » .\nLa question de savoir si l'Afrique pourrait mettre à profit l'expansion agricole pour « tirer » la croissance industrielle, en particulier en ce qui concerne les industries rurales, dépend en partie des possibilités dont elle dispose pour accroitre la productivité agricole. La réorganisation massive qui a eu lieu en chine n'est guère concevable en Afrique. Les progrès de la « révolution verte » qui ont entrainé l'industrialisation des campagnes dans certains autres pays asiatiques sont probablement plus difficiles à réaliser qu'en Asie, spécialement dans le secteur de la production alimentaire. Les racines alimentaires qui, dans de nombreux pays africains, représentent plus de la moitié de la ration calorifique se prêtent moins aux innovations qui ont permis d'augmenter les rendements de riz, de blé et de maïs en Asie.";

// ─── English Questions (Questions 1-9, with matching question 7 removed) ──────

const ENGLISH_QUESTIONS = [
  // Question 1: Title for English Text
  {
    question: 'Indicate the title which best suits the above text.',
    options: [
      'Decline in Education.',
      'Education in Africa and in the world.',
      'Education as a priority',
      'Education : hope for nations',
      'Rising and falling rate of school population.',
    ],
    answer: 2, // C: Education as a priority
  },
  // Question 2: Education investment
  {
    question: 'Education is the best investment nations can make because it :',
    options: [
      'Helps people to accomplish their projets.',
      "Accounts for half of the world's shool population out of school.",
      'Leads people to lack quality learning.',
      'Permits to nations to form a good population.',
      'Brings shared values to life.',
    ],
    answer: 4, // E: Brings shared values to life.
  },
  // Question 3: Duty of governments
  {
    question: 'The duty of governments is to :',
    options: [
      'Provide an entry point for the job market.',
      'Send all girls and all boys to school.',
      'Launch a new initiative in education.',
      'Get their children back to school.',
      'Give hope to people who are missing education.',
    ],
    answer: 4, // E: Give hope to people who are missing education.
  },
  // Question 4: Number of areas in Education First
  {
    question:
      'The project « education first » intends to focus on how many areas?',
    options: ['One.', 'Two.', 'Three.', 'Four.', 'Five.'],
    answer: 2, // C: Three.
  },
  // Question 5: Education First intention
  {
    question: 'The project « education first » intends to :',
    options: [
      'Outline the lack of right of children to education.',
      'Improve the quality of learning.',
      'Reduce the gender parity gap.',
      'Explain the crisis which affects education.',
      'Encourage children to go to shool.',
    ],
    answer: 1, // B: Improve the quality of learning.
  },
  // Question 6: Pronoun reference
  {
    question: 'The word « they » underlined in the first paragraph refers to :',
    options: [
      'Adults.',
      'Parents.',
      'Children and youth.',
      'Success storries.',
      'Equitable societies.',
    ],
    answer: 2, // C: Children and youth.
  },
  // Question 7: REMOVED - Matching question
  // Question 8: Determinative
  {
    question:
      'Indicate the convenient determinative to complete the sentence :',
    options: ['Which.', 'Whom.', 'Who.', 'To whom.', 'Whose.'],
    answer: 2, // C: Who.
  },
  {
    question: 'The word « prosperous » in the text means :',
    options: [
      'Poor.',
      'Successful and wealthy.',
      'Unhappy.',
      'Dangerous.',
      'Small.',
    ],
    answer: 1, // B: Successful and wealthy.
  },
];

// ─── French Questions (Questions 10-20) ──────────────────────────────────────

const FRENCH_QUESTIONS = [
  // Question 10: French text - correct proposition
  {
    question: "Indiquez la proposition conforme à la pensée de l'auteur",
    options: [
      'Les voies de communication contribuent au bien – être des pauvres.',
      'Le pourcentage de la production alimentaire transformée en force faible en Afrique.',
      'Les emplois du secteur agricole sont éphémères et peu rémunérateur.',
      "Les reformes agricoles menées en Chine ont eu un impact positif sur l'économie.",
      "La sécurité alimentaire dépend étroitement du pouvoir d'achat des consommateurs.",
    ],
    answer: 1, // B: Le pourcentage de la production alimentaire transformée en force faible en Afrique.
  },
  // Question 11: Title for French text
  {
    question: 'Indiquez le titre qui convient le mieux à ce texte.',
    options: [
      'La politique industrielle.',
      "L'agriculture Africaine.",
      'La chine des années 80.',
      'La sécurité alimentaire.',
      'la commercialisation des denrées alimentaires.',
    ],
    answer: 3, // D: La sécurité alimentaire.
  },
  // Question 12: Factor NOT contributing to food security
  {
    question:
      "Le facteur qui ne contribue pas à l'amélioration de la sécurité alimentaire est :",
    options: [
      'La production des intrants agricoles.',
      'Le faible taux de transformation de la production alimentaire.',
      'Le renforcement des systèmes de commercialisation des denrées alimentaires.',
      "La corrélation entre l'agriculture et la politique industrielle.",
      "L'amélioration des installations de stockage des denrées alimentaires.",
    ],
    answer: 1, // B: Le faible taux de transformation de la production alimentaire.
  },
  // Question 13: French text - correct proposition
  {
    question: "Indiquez la proposition conforme à la pensée de l'auteur",
    options: [
      "Les fonds générés en agriculture ont permis de monter l'industrie rurale en chine.",
      "L'industrie rurale africaine s'inspire du modelé chinois.",
      "La « révolution verte » n'a pas apporté le développement souhaité en Asie.",
      "A l'instar du riz et du maïs les racines alimentaires africaines connaissent un meilleur rendement.",
      "Avec la « révolution verte », l'Afrique a nettement amélioré ses exportations agricoles.",
    ],
    answer: 0, // A: Les fonds générés en agriculture ont permis de monter l'industrie rurale en chine.
  },
  // Question 14: Summary of first paragraph
  {
    question: "Indiquez l'idée qui résume le mieux le 1er paragraphe.",
    options: [
      "Sans se recroqueviller sur elle-même, l'Afrique doit inventer son propre développement.",
      "L'expérience chinoise et Asiatique ne peut être réalisée en Afrique.",
      'La croissance de la production agricole est un facteur déterminant dans la création des emplois.',
      "La chine et le reste de l'Asie doivent inspirer l'Afrique.",
      'Plusieurs facteurs doivent être mis à contribution en vue de réaliser le bien- être des démunis.',
    ],
    answer: 0, // A: Sans se recroqueviller sur elle-même, l'Afrique doit inventer son propre développement.
  },
  // Question 15: Function of infinitive
  {
    question:
      "Indiquez la fonction de l'infinitif souligné dans la phrase suivante : « accroître cette productivité devrait être l'un des objectifs de la politique industrielle »",
    options: ['C.O.I.', 'C.du nom.', 'Sujet.', 'C.O.D.', 'C.circ.de but.'],
    answer: 2, // C: Sujet.
  },
  // Question 16: Nature of the underlined word
  {
    question:
      'Indiquez la nature du mot souligné dans la phrase suivante : « Les emplois hors agriculture fournissent des revenus diversifiés. »',
    options: [
      'Conjonction de subordination.',
      'Préposition.',
      'Adverbe de négation.',
      'Adverbe de doute.',
      'Conjonction de coordination.',
    ],
    answer: 1, // B: Préposition.
  },
  // Question 17: Figure of speech
  {
    question:
      'Indiquez la figure de style employée dans la phrase suivante : « Nous congolais, vivant dans le pays le plus développé du monde, prenons trois repas par jour »',
    options: [
      'La métaphore.',
      "L'ellipse.",
      'La litote.',
      "L'ironie.",
      'la pléonasme.',
    ],
    answer: 3, // D: L'ironie.
  },
  // Question 18: Preposition
  {
    question:
      'Dans la phrase : Mon fils se désintéresse totalement...son travail » les pointillés doivent être remplacés par la préposition',
    options: ['De.', 'Sur.', 'Vers.', 'à.', 'En.'],
    answer: 0, // A: De.
  },
  // Question 19: Grammatical function
  {
    question:
      'La subordonnée soulignée dans la phrase suivante : « que vous passiez une heure sur le site ou que vous restiez toute la journée, le prix est le même », à la fonction grammaticale de complément circonstanciel :',
    options: [
      'De temps.',
      "D'opposition.",
      'De comparaison.',
      'De début.',
      'De condition.',
    ],
    answer: 0, // A: De temps.
  },
  // Question 20: Author of Ngando
  {
    question: "Ngando est l'œuvre de :",
    options: [
      'Georges Ngal.',
      'Kawata ashem tem.',
      'Paul lomami tshibamba.',
      'Zamenga Batukezanga.',
      'V.Y. Mudimbe.',
    ],
    answer: 3, // D: Zamenga Batukezanga.
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function bootstrap() {
  console.log('🌱 Starting Scientifique 2015 seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const itemModel = app.get<typeof Item>(getModelToken(Item));
  const courseModel = app.get<typeof ItemCourse>(getModelToken(ItemCourse));
  const questionModel = app.get<typeof ItemQuestion>(
    getModelToken(ItemQuestion),
  );

  // ─── Find the 2015 Languages item for the Scientifique section ─────────────
  console.log('🔍 Looking for the Scientifique Languages item for 2015...');

  const targetItem = await itemModel.findOne({
    where: {
      year: 2015,
      type: ItemTypeEnum.LANGUES,
      section_id: SCIENTIFIQUE_SECTION_ID,
    },
  });

  if (!targetItem) {
    console.log('⚠️  No Scientifique Languages item found for 2015.');
    console.log('   Please ensure seed-items.ts has been run first.');
    await app.close();
    process.exit(1);
  }

  console.log(
    `✅ Found item: ID ${targetItem.id}, Section: SCIENTIFIQUE, Type: ${targetItem.type}, Year: ${targetItem.year}\n`,
  );

  // ─── Create only the courses that do not already exist ─────────────────────
  const courses = [
    {
      name: 'ANGLAIS',
      passage: ENGLISH_PASSAGE,
      questions: ENGLISH_QUESTIONS,
    },
    {
      name: 'FRANÇAIS',
      passage: FRENCH_PASSAGE,
      questions: FRENCH_QUESTIONS,
    },
  ];

  let coursesCreated = 0;
  let coursesSkipped = 0;
  let questionsCreated = 0;

  for (const courseData of courses) {
    const existingCourse = await courseModel.findOne({
      where: {
        item_id: targetItem.id,
        course: courseData.name,
      },
    });

    if (existingCourse) {
      console.log(`⏭️  ${courseData.name} already exists. Skipping.`);
      coursesSkipped++;
      continue;
    }

    console.log(`📝 Creating ${courseData.name} course...`);
    const course = await courseModel.create({
      course: courseData.name,
      item_id: targetItem.id,
      passage: courseData.passage,
    });

    const questionsToInsert = courseData.questions.map((question) => ({
      question: question.question,
      item_course_id: course.id,
      options: question.options,
      answer: question.answer,
    }));

    await questionModel.bulkCreate(questionsToInsert);
    coursesCreated++;
    questionsCreated += questionsToInsert.length;
    console.log(
      `✅ Created ${courseData.name} with ${questionsToInsert.length} questions.`,
    );
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('✅ Seed complete!');
  console.log(`   Courses created: ${coursesCreated}`);
  console.log(`   Courses skipped: ${coursesSkipped}`);
  console.log(`   Questions created: ${questionsCreated}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
