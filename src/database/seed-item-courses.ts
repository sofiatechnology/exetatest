import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item, ItemTypeEnum } from 'src/models/item.model';
import { ItemCourse } from 'src/models/item-course.model';
import { ItemQuestion } from 'src/models/item-question.model';

// ─── French content bank per type ────────────────────────────────────────────

const COURSES_BY_TYPE: Record<ItemTypeEnum, string[]> = {
  [ItemTypeEnum.CULTURE_GENERALE]: [
    'Histoire de la civilisation africaine',
    'Géographie politique du monde contemporain',
    'Philosophie et pensée critique',
    'Éducation civique et droits de l\'homme',
    'Littérature francophone',
    'Art et culture générale',
    'Histoire du Congo et de l\'Afrique centrale',
    'Introduction aux sciences sociales',
  ],
  [ItemTypeEnum.SCIENCES]: [
    'Biologie cellulaire et génétique',
    'Chimie organique et inorganique',
    'Physique mécanique et thermodynamique',
    'Sciences de la vie et de la terre',
    'Mathématiques appliquées aux sciences',
    'Anatomie et physiologie humaine',
    'Écologie et environnement',
    'Astronomie et cosmologie',
  ],
  [ItemTypeEnum.COURS_OPTIONS]: [
    'Technologie industrielle',
    'Gestion des entreprises',
    'Informatique et programmation',
    'Électrotechnique appliquée',
    'Agriculture et agro-alimentaire',
    'Arts appliqués et métiers',
    'Économie domestique',
    'Mécanique générale appliquée',
  ],
  [ItemTypeEnum.LANGUES]: [
    'Grammaire et syntaxe française',
    'Expression écrite et rédaction',
    'Compréhension de textes littéraires',
    'Langue et civilisation latine',
    'Introduction à la linguistique',
    'Littérature classique française',
    'Analyse de textes philosophiques',
    'Communication orale et rhétorique',
  ],
};

const PASSAGES_BY_TYPE: Record<ItemTypeEnum, string[]> = {
  [ItemTypeEnum.CULTURE_GENERALE]: [
    'L\'Afrique subsaharienne a connu de profondes transformations sociales et politiques au cours du XXe siècle. Les mouvements d\'indépendance ont redessiné les frontières et les structures gouvernementales de nombreux pays.',
    'La démocratie est un système politique fondé sur la souveraineté du peuple. Elle implique la participation des citoyens à la vie publique, la protection des droits fondamentaux et la séparation des pouvoirs.',
    'La culture est l\'ensemble des pratiques, des croyances, des valeurs et des expressions artistiques qui caractérisent une communauté humaine. Elle se transmet de génération en génération.',
  ],
  [ItemTypeEnum.SCIENCES]: [
    'La cellule est l\'unité fondamentale du vivant. Toute cellule provient d\'une cellule préexistante par division cellulaire. On distingue les cellules procaryotes, dépourvues de noyau, et les cellules eucaryotes qui en possèdent un.',
    'La loi de la conservation de l\'énergie stipule que l\'énergie totale d\'un système isolé reste constante. Elle peut se transformer d\'une forme à une autre, mais ne peut ni être créée ni détruite.',
    'La photosynthèse est un processus biochimique par lequel les plantes vertes convertissent l\'énergie lumineuse en énergie chimique, en utilisant le dioxyde de carbone et l\'eau pour produire du glucose.',
  ],
  [ItemTypeEnum.COURS_OPTIONS]: [
    'La gestion d\'une entreprise nécessite une planification rigoureuse, une organisation efficace des ressources humaines et matérielles, ainsi qu\'un contrôle régulier des activités pour atteindre les objectifs fixés.',
    'L\'électricité est produite par le déplacement d\'électrons dans un conducteur. Le courant électrique se mesure en ampères, la tension en volts et la puissance en watts.',
    'L\'agriculture durable vise à produire des aliments en préservant les ressources naturelles et en minimisant l\'impact environnemental. Elle repose sur des pratiques respectueuses des écosystèmes.',
  ],
  [ItemTypeEnum.LANGUES]: [
    'La langue française est issue du latin vulgaire parlé dans les provinces romaines de la Gaule. Elle s\'est développée progressivement à travers les siècles pour devenir la langue de Molière et de Victor Hugo.',
    'La grammaire est l\'ensemble des règles qui régissent l\'usage d\'une langue. Elle comprend la morphologie, qui étudie la forme des mots, et la syntaxe, qui étudie leur agencement dans la phrase.',
    'La littérature francophone désigne l\'ensemble des œuvres littéraires écrites en français, qu\'elles proviennent de France, de Belgique, du Canada, d\'Afrique ou d\'autres régions du monde.',
  ],
};

const QUESTIONS_BY_TYPE: Record<ItemTypeEnum, Array<{
  question: string;
  options: string[];
  answer: number; // 0-based index
}>> = {
  [ItemTypeEnum.CULTURE_GENERALE]: [
    { question: 'Quelle est la capitale de la République Démocratique du Congo ?', options: ['Brazzaville', 'Kinshasa', 'Lubumbashi', 'Kisangani'], answer: 1 },
    { question: 'En quelle année la RDC a-t-elle accédé à l\'indépendance ?', options: ['1958', '1960', '1962', '1965'], answer: 1 },
    { question: 'Quel est le fleuve le plus long d\'Afrique centrale ?', options: ['Le Niger', 'Le Zambèze', 'Le Congo', 'Le Nil'], answer: 2 },
    { question: 'Quelle organisation regroupe les États africains ?', options: ['ONU', 'OTAN', 'Union Africaine', 'ASEAN'], answer: 2 },
    { question: 'Qu\'est-ce que la démocratie participative ?', options: ['Un régime militaire', 'Un système où les citoyens participent directement aux décisions', 'Un gouvernement de technocrates', 'Une monarchie constitutionnelle'], answer: 1 },
    { question: 'Quel philosophe a dit "Je pense donc je suis" ?', options: ['Platon', 'Aristote', 'Descartes', 'Kant'], answer: 2 },
    { question: 'Combien de pays composent l\'Union Africaine ?', options: ['45', '50', '54', '60'], answer: 2 },
    { question: 'Quel est le rôle du pouvoir législatif ?', options: ['Exécuter les lois', 'Voter les lois', 'Juger les infractions', 'Commander l\'armée'], answer: 1 },
    { question: 'Qu\'est-ce que la souveraineté nationale ?', options: ['Le pouvoir absolu du roi', 'Le droit d\'un peuple à se gouverner lui-même', 'La puissance militaire d\'un pays', 'La richesse économique d\'une nation'], answer: 1 },
    { question: 'Quel est le principe fondamental des droits de l\'homme ?', options: ['Ils sont accordés par l\'État', 'Ils sont universels et inaliénables', 'Ils varient selon les cultures', 'Ils s\'appliquent uniquement aux citoyens'], answer: 1 },
  ],
  [ItemTypeEnum.SCIENCES]: [
    { question: 'Quelle est la formule chimique de l\'eau ?', options: ['H2O2', 'HO', 'H2O', 'H3O'], answer: 2 },
    { question: 'Quel est l\'élément le plus abondant dans l\'univers ?', options: ['Oxygène', 'Carbone', 'Hydrogène', 'Hélium'], answer: 2 },
    { question: 'Quelle est l\'unité de mesure de la force ?', options: ['Watt', 'Joule', 'Newton', 'Pascal'], answer: 2 },
    { question: 'Combien de chromosomes possède une cellule humaine normale ?', options: ['23', '46', '48', '44'], answer: 1 },
    { question: 'Quel organe produit l\'insuline ?', options: ['Le foie', 'Les reins', 'Le pancréas', 'La rate'], answer: 2 },
    { question: 'Quelle est la vitesse de la lumière dans le vide ?', options: ['300 000 m/s', '300 000 km/s', '3 000 km/s', '30 000 km/s'], answer: 1 },
    { question: 'Qu\'est-ce que la mitose ?', options: ['La mort cellulaire', 'La division cellulaire produisant deux cellules identiques', 'La fusion de deux cellules', 'La reproduction sexuée'], answer: 1 },
    { question: 'Quel est le symbole chimique du fer ?', options: ['Fe', 'Fr', 'Fi', 'Fer'], answer: 0 },
    { question: 'Quelle est la fonction de la chlorophylle ?', options: ['Transporter l\'oxygène', 'Absorber la lumière pour la photosynthèse', 'Stocker l\'eau', 'Protéger la cellule'], answer: 1 },
    { question: 'Quel est le tableau périodique des éléments ?', options: ['Un tableau historique des scientifiques', 'Une classification des éléments chimiques', 'Un graphique des températures', 'Un tableau des réactions chimiques'], answer: 1 },
  ],
  [ItemTypeEnum.COURS_OPTIONS]: [
    { question: 'Qu\'est-ce qu\'un circuit électrique en série ?', options: ['Un circuit avec plusieurs branches parallèles', 'Un circuit où les composants sont branchés l\'un après l\'autre', 'Un circuit sans résistance', 'Un circuit à courant alternatif'], answer: 1 },
    { question: 'Quelle est la loi d\'Ohm ?', options: ['P = UI', 'U = RI', 'I = P/U', 'R = UI'], answer: 1 },
    { question: 'Qu\'est-ce que la comptabilité en partie double ?', options: ['Tenir deux livres comptables', 'Chaque opération affecte au moins deux comptes', 'Doubler les bénéfices', 'Compter deux fois les dépenses'], answer: 1 },
    { question: 'Quel est le rôle d\'un disjoncteur ?', options: ['Produire de l\'électricité', 'Protéger un circuit contre les surcharges', 'Transformer le courant', 'Mesurer la tension'], answer: 1 },
    { question: 'Qu\'est-ce que le bilan comptable ?', options: ['Un rapport de performance', 'Un tableau représentant l\'actif et le passif d\'une entreprise', 'Un résumé des ventes', 'Une liste des employés'], answer: 1 },
    { question: 'Quelle matière première est la plus utilisée en construction ?', options: ['Le bois', 'Le métal', 'Le béton', 'Le verre'], answer: 2 },
    { question: 'Qu\'est-ce qu\'un algorithme ?', options: ['Un langage de programmation', 'Une suite d\'instructions pour résoudre un problème', 'Un type d\'ordinateur', 'Un virus informatique'], answer: 1 },
    { question: 'Qu\'est-ce que la rotation des cultures ?', options: ['Tourner le tracteur', 'Alterner les cultures sur une même parcelle', 'Irriguer les champs', 'Récolter en automne'], answer: 1 },
    { question: 'Quel est le principe du moteur à explosion ?', options: ['L\'énergie solaire', 'La combustion d\'un mélange air-carburant', 'L\'énergie électrique', 'La vapeur d\'eau'], answer: 1 },
    { question: 'Qu\'est-ce que la résistance électrique ?', options: ['La capacité à conduire le courant', 'L\'opposition d\'un matériau au passage du courant', 'La puissance d\'un circuit', 'La fréquence du courant'], answer: 1 },
  ],
  [ItemTypeEnum.LANGUES]: [
    { question: 'Quel est le sujet de la phrase : "Le chat mange la souris" ?', options: ['mange', 'la souris', 'Le chat', 'aucun'], answer: 2 },
    { question: 'Qu\'est-ce qu\'un adverbe ?', options: ['Un mot qui désigne une personne', 'Un mot qui modifie un verbe, un adjectif ou un autre adverbe', 'Un mot qui exprime une action', 'Un mot qui remplace un nom'], answer: 1 },
    { question: 'Quel temps verbal exprime une action passée et terminée ?', options: ['L\'imparfait', 'Le présent', 'Le passé composé', 'Le futur simple'], answer: 2 },
    { question: 'Qu\'est-ce qu\'une métaphore ?', options: ['Une répétition de mots', 'Une comparaison sans outil comparatif', 'Une question rhétorique', 'Une énumération'], answer: 1 },
    { question: 'Quel est l\'antonyme du mot "rapide" ?', options: ['Vif', 'Lent', 'Fort', 'Grand'], answer: 1 },
    { question: 'Comment s\'appelle la virgule en français ?', options: ['Point-virgule', 'Virgule', 'Tiret', 'Apostrophe'], answer: 1 },
    { question: 'Qu\'est-ce qu\'un synonyme ?', options: ['Un mot de sens contraire', 'Un mot de même sens', 'Un mot de même son', 'Un mot de même étymologie'], answer: 1 },
    { question: 'Quelle figure de style est utilisée dans "Il pleut des cordes" ?', options: ['Une métonymie', 'Une hyperbole', 'Une métaphore', 'Une personnification'], answer: 2 },
    { question: 'Qu\'est-ce que le COD ?', options: ['Complément d\'objet direct', 'Complément d\'origine directe', 'Complément obligatoire du nom', 'Complément d\'objet déterminé'], answer: 0 },
    { question: 'Quel est le pluriel du mot "cheval" ?', options: ['Chevals', 'Chevaux', 'Chevales', 'Chevauls'], answer: 1 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function randomCourseCount(): number {
  return Math.random() < 0.5 ? 2 : 3;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function bootstrap() {
  console.log('🌱 Starting ItemCourses + ItemQuestions seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const itemModel = app.get<typeof Item>(getModelToken(Item));
  const courseModel = app.get<typeof ItemCourse>(getModelToken(ItemCourse));
  const questionModel = app.get<typeof ItemQuestion>(getModelToken(ItemQuestion));

  // ─── Load all existing items ───────────────────────────────────────────────
  console.log('📦 Loading all items...');
  const allItems = await itemModel.findAll({ raw: true });
  console.log(`   Found ${allItems.length} items\n`);

  if (allItems.length === 0) {
    console.log('⚠️  No items found. Run seed:items first.');
    await app.close();
    process.exit(1);
  }

  // ─── Load existing courses (to detect what already exists) ────────────────
  console.log('🔍 Loading existing courses...');
  const existingCourses = await courseModel.findAll({
    attributes: ['id', 'item_id', 'course'],
    raw: true,
  });

  // item_id → Set of course names already seeded
  const coursesByItem = new Map<string, Set<string>>();
  for (const c of existingCourses) {
    if (!coursesByItem.has(c.item_id)) coursesByItem.set(c.item_id, new Set());
    coursesByItem.get(c.item_id)!.add(c.course);
  }

  // course_id → number of questions already seeded
  const existingQuestions = await questionModel.findAll({
    attributes: ['item_course_id'],
    raw: true,
  });
  const questionCountByCourse = new Map<string, number>();
  for (const q of existingQuestions) {
    questionCountByCourse.set(
      q.item_course_id,
      (questionCountByCourse.get(q.item_course_id) ?? 0) + 1,
    );
  }

  console.log(`   Found ${existingCourses.length} existing courses`);
  console.log(`   Found ${existingQuestions.length} existing questions\n`);

  // ─── Seed ─────────────────────────────────────────────────────────────────
  let coursesCreated = 0;
  let coursesSkipped = 0;
  let questionsCreated = 0;
  let questionsSkipped = 0;

  const QUESTIONS_PER_COURSE = 5;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const type = item.type as ItemTypeEnum;
    const coursePool = COURSES_BY_TYPE[type];
    const questionPool = QUESTIONS_BY_TYPE[type];
    const passagePool = PASSAGES_BY_TYPE[type];

    const targetCount = randomCourseCount();
    const existingForItem = coursesByItem.get(item.id) ?? new Set();

    // Pick courses not yet created for this item
    const availableCourses = coursePool.filter((c) => !existingForItem.has(c));
    const needed = Math.max(0, targetCount - existingForItem.size);
    const toCreate = pickRandomN(availableCourses, needed);

    if (toCreate.length === 0) {
      coursesSkipped += existingForItem.size;
    }

    for (const courseName of toCreate) {
      const course = await courseModel.create({
        course: courseName,
        item_id: item.id,
        passage: pickRandom(passagePool),
      });

      coursesCreated++;

      // Create 5 questions for this new course
      const selectedQuestions = pickRandomN(questionPool, QUESTIONS_PER_COURSE);
      const questionsToInsert = selectedQuestions.map((q) => ({
        question: q.question,
        item_course_id: course.id,
        options: q.options,
        answer: q.answer,
      }));

      await questionModel.bulkCreate(questionsToInsert);
      questionsCreated += questionsToInsert.length;
    }

    // For courses that already exist, check if their questions are complete
    const existingCourseRecords = await courseModel.findAll({
      where: { item_id: item.id },
      attributes: ['id'],
      raw: true,
    });

    for (const existingCourse of existingCourseRecords) {
      const qCount = questionCountByCourse.get(existingCourse.id) ?? 0;
      if (qCount >= QUESTIONS_PER_COURSE) {
        questionsSkipped += qCount;
        coursesSkipped++;
        continue;
      }

      // Top up missing questions
      const missing = QUESTIONS_PER_COURSE - qCount;
      const topUp = pickRandomN(questionPool, missing);
      const topUpData = topUp.map((q) => ({
        question: q.question,
        item_course_id: existingCourse.id,
        options: q.options,
        answer: q.answer,
      }));
      await questionModel.bulkCreate(topUpData);
      questionsCreated += topUpData.length;
    }

    // Progress
    if ((i + 1) % 100 === 0 || i + 1 === allItems.length) {
      process.stdout.write(`\r📝 Processed ${i + 1} / ${allItems.length} items...`);
    }
  }

  console.log('\n\n✅ Seed complete!');
  console.log(`   Courses  created : ${coursesCreated}`);
  console.log(`   Courses  skipped : ${coursesSkipped}`);
  console.log(`   Questions created: ${questionsCreated}`);
  console.log(`   Questions skipped: ${questionsSkipped}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});