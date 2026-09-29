import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { Section } from '../../../src/models/section.model';
import { Course } from '../../../src/models/course.model';
import { Level } from '../../../src/models/level.model';
import { Modele } from '../../../src/models/modele.model';
import { Question } from '../../../src/models/question.model';

/** Latin course seed for LATIN – PHILO (section_id: 01). */

export interface LatinSeedQuestion {
  text: string;
  response: string[];
  /** 0-based index of the correct option in response. */
  correct_answer: number;
  /** Time limit in seconds. */
  time: number;
}

export interface LatinSeedLevel {
  title: string;
  passage: string;
  questions: LatinSeedQuestion[];
}

export interface LatinCourseSeed {
  course: string;
  section_id: string;
  modele_title: string;
  levels: LatinSeedLevel[];
}

export const latinCourseSeed: LatinCourseSeed = {
  course: "Latin",
  section_id: "01",
  modele_title: "Latin - Questions d'exploitation",
  levels: [
    {
      title: "TEXTE 1 : PRO ARCHIA, §§1-4a (EXORDE)",
      passage: "§1, 1° : Je suis redevable à mon maître Archias.\n\nSi quid est in me ingenii, iudices, quod sentio quam sit exiguum, aut si qua exercitatio dicendi, in qua me non infitior mediocriter esse versatum, aut si huiusce rei ratio aliqua ab optimarum artium studiis ac disciplina profecta, a qua ego nullum confiteor aetatis meae tempus abhorruisse, horum omnium rerum vel in primis hic A. Licinius fructum a me repetere suo iure debet.\n\n§1, 2° : Archias mon inspirateur et mon précepteur.\n\nNam, quoad longissime mea mens potest respicere spatium temporis praeteriti et recordari ultimam memoriam pueritiae, repetens usque inde, video hunc exstitisse principem mihi et ad suscipiendam et ad ingrediendam rationem horum studiorum.\n\n§1, 3° : Moi qui en ai défendu d'autres, je dois défendre mon maître.\n\nQuod si haec vox conformata hortatu et praeceptis huius fuit aliquando saluti nonnullis, quantum est situm in nobis, debemus profecto ferre et salutem et spem huic ipsi, a quo accepimus id a quo possemus servare alios et opitulari ceteris.\n\n§2 : Tous les arts libéraux sont parents.\n\nAc, ne quis miretur forte hoc dici a nobis ita, quod alia quaedam facultas ingenii sit in hoc neque haec ratio aut haec facultas dicendi aut disciplina ne nos quidem umquam fuimus dediti penitus huic uni studio. Et enim omnes artes quae pertinent ad humanitatem, habent quoddam vinculum commune, et continentur inter se quasi quadam cognatione.\n\n§3 : Un discours d'un genre nouveau.\n\nSed ne videatur esse mirum cuiquam vestrum, in quaestione legitima et in iudicio publico, cum res agatur apud praetorem populi Romani, virum lectissimum, et apud iudices severissimos, tanto conventu ac frequentia hominum, me uti hoc genere dicendi quod abhorreat non modo a consuetudine iudiciorum verum etiam a sermone forensi, quaeso a vobis ut detis mihi in hac causa hanc veniam, accommodatam huic rei, quemadmodum spero non molestam vobis, ut patiamini me dicentem pro summo poeta atque homine eruditissimo, hoc concursu hominum litteratissimorum, hac vestra humanitate, denique hoc praetore exercente iudicium, loqui paulo liberius de studiis humanitatis ac litterarum, et uti quodam genere dicendi prope novo et inusitato, in persona eius modi quae minime est tractata in iudiciis et periculis propter otium ac studium.\n\n§4a : Proposition et division : les deux points du plan.\n\nEt si sentiam id tribui et concedi mihi a vobis, perficiam profecto ut putetis hunc A. Licinium non modo non esse segregandum a numero civium, cum sit civis, verum etiam (putetis) hunc A. Licinium fuisse adsciscendum si non esset.",
      questions: [
        {
          text: "Marcus Tullius Cicero est né en...",
          response: ["106 av. J.-C.", "43 av. J.-C.", "70 av. J.-C.", "55 av. J.-C.", "63 av. J.-C."],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans sa carrière politique, Cicéron fut notamment élu consul en...",
          response: ["76 av. J.-C.", "70 av. J.-C.", "69 av. J.-C.", "63 av. J.-C.", "57 av. J.-C."],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "Le Pro Archia est un discours qui a été prononcé devant...",
          response: ["Le Sénat", "L'Empereur", "Une \"Quaestio perpetua\" (tribunal permanent)", "L'Assemblée du peuple", "Le Préteur urbain"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Quelle est l'affaire jugée dans le Pro Archia ?",
          response: ["Un meurtre politique", "Une affaire de concussion", "Une question de naturalisation (droit de cité)", "Une corruption électorale", "Un vol de biens sacrés"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "La \"Lex Plautia Papiria\" (89 av. J.-C.) accordait le droit de cité à condition de...",
          response: ["Être né à Rome", "Avoir un domicile en Italie, avoir obtenu le droit de cité dans une civitas et avoir fait sa déclaration devant le préteur", "Servir dans l'armée pendant dix ans", "Être affranchi par un citoyen romain", "Payer une taxe spéciale"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans la phrase \"Si quid est in me ingenii\", le mot \"ingenium\" signifie...",
          response: ["La naissance", "Le talent, le don naturel", "L'intelligence artificielle", "Le génie militaire", "La richesse"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie le verbe \"infitior\" dans la phrase \"in qua me non infitior mediocriter esse versatum\" ?",
          response: ["J'avoue", "Je nie", "Je persévère", "Je m'exerce", "Je réussis"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans l'expression \"exercitatio dicendi\", le mot \"exercitatio\" signifie...",
          response: ["Le discours", "La théorie", "La pratique, l'entraînement", "La perfection", "Le talent"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Le verbe \"abhorruisse\" (abhorreo) signifie...",
          response: ["Avoir horreur de, s'écarter de", "Aimer passionnément", "Se souvenir de", "Avoir besoin de", "Commencer"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans la phrase \"horum omnium rerum vel in primis hic A. Licinius fructum a me repetere suo iure debet\", le mot \"fructum\" signifie...",
          response: ["Le fruit (au sens propre)", "La récompense, le bénéfice", "La punition", "La dette", "L'enseignement"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"Si quid est in me ingenii\", le mot \"ingenii\" est un génitif...",
          response: ["Possessif", "Subjectif", "Partitif", "Objectif", "De qualité"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "La forme \"quod sentio quam sit exiguum\" contient une proposition...",
          response: ["Relative", "Interrogative indirecte", "Infinitive", "Conjonctive", "Participiale"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"aut si huiusce rei ratio aliqua\", l'adjectif \"huiusce\" est un génitif singulier du démonstratif...",
          response: ["Hic, haec, hoc", "Ille, illa, illud", "Is, ea, id", "Ipse, ipsa, ipsum", "Idem, eadem, idem"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La forme \"abhorruisse\" est un infinitif...",
          response: ["Présent", "Parfait", "Futur", "Parfait passif", "Présent passif"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans la phrase \"ab optimarum artium studiis ac disciplina profecta\", l'adjectif \"optimarum\" est...",
          response: ["Accusatif pluriel", "Nominatif singulier", "Génitif pluriel", "Datif singulier", "Ablatif pluriel"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"Hic A. Licinius\" est un exemple des...",
          response: ["Tria nomina (prénom, nom de la gens, surnom)", "Duo nomina (prénom et nom)", "Cognomen seul", "Nomen seul", "Praenomen seul"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"ad suscipiendam et ad ingrediendam rationem\", les formes en \"-ndam\" sont des...",
          response: ["Gérondifs", "Adjectifs verbaux (gérondifs à valeur de but)", "Participes passés", "Supins", "Infinitifs futurs"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "La phrase \"ne quis miretur\" contient un subjonctif...",
          response: ["Jussif", "Final", "Potentiel", "Optatif", "Concessif"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Continentur inter se quasi quadam cognatione\" : le mot \"cognatione\" est à l'ablatif pour exprimer...",
          response: ["Le lieu", "La cause", "Le moyen", "Le temps", "L'agent"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"quod abhorreat non modo a consuetudine iudiciorum verum etiam a sermone forensi\", l'expression \"non modo... verum etiam\" signifie...",
          response: ["Ni... ni...", "Ou... ou...", "Non seulement... mais aussi...", "Tantôt... tantôt...", "Soit... soit..."],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"Si quid est in me ingenii\" est un exemple de...",
          response: ["Hyperbate", "Anaphore", "Chiasme", "Litote", "Métaphore"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Aut si qua exercitatio dicendi... aut si huiusce rei ratio aliqua\" est un exemple de...",
          response: ["Anaphore", "Épanadiplose", "Polysyndète", "Assonance", "Paronomase"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"ab studiis ac disciplina\" est un exemple de...",
          response: ["Hendiadys", "Chiasme", "Pléonasme", "Antithèse", "Métaphore"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"confiteor\" et \"non infitior\" sont un exemple de...",
          response: ["Paronomase", "Allitération", "Assonance", "Hyperbole", "Oxymore"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"respicere spatium temporis praeteriti et recordari ultimam memoriam pueritiae\" est un exemple de...",
          response: ["Pléonasme", "Litote", "Zeugma", "Antithèse", "Prosopopée"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans ce texte, l'argument principal de Cicéron pour défendre Archias est...",
          response: ["Archias est un citoyen romain de naissance", "Archias est un grand poète que tous les Romains admirent", "Archias est son maître et c'est à lui qu'il doit son talent d'orateur", "Archias est riche et puissant", "Archias a sauvé Rome d'une conspiration"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Le passage §4a où Cicéron expose les deux points de son plan s'appelle...",
          response: ["L'exorde", "La narratio", "La proposition et la division", "La péroraison", "L'argumentatio extra causam"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Les \"tria nomina\" du citoyen romain sont...",
          response: ["Praenomen, nomen, cognomen", "Nomen, cognomen, agnomen", "Praenomen, nomen, patronyme", "Cognomen, agnomen, signum", "Nomen, praenomen, gentilice"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"perficiam profecto ut putetis\", le verbe \"putetis\" est au subjonctif présent parce qu'il est...",
          response: ["Dans une proposition indépendante", "Dans une proposition finale", "Dans une proposition complétive introduite par \"ut\"", "Dans une proposition interrogative indirecte", "Dans une proposition concessive"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "La meilleure traduction de \"fuisse adsciscendum\" dans la phrase finale est...",
          response: ["A été admis", "Devait être admis", "A été ajouté", "Est en train d'être admis", "Sera admis"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le paragraphe 3, où Cicéron demande la permission de parler librement, est un exemple de...",
          response: ["Captatio benevolentiae", "Peroratio", "Refutatio", "Digressio", "Exordium"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"non modo... verum etiam\", on reconnaît une construction de...",
          response: ["Comparaison", "Corrélation", "Opposition", "Cause", "Conséquence"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le verbe \"suscipiendam\" est formé sur le radical du verbe...",
          response: ["Suscipio (prendre en charge, entreprendre)", "Suscito (exciter)", "Susurro (murmurer)", "Sustento (soutenir)", "Suspecto (soupçonner)"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La \"Lex Papia\" (65 av. J.-C.), mentionnée en introduction du Pro Archia, ordonnait...",
          response: ["D'accorder le droit de cité à tous les Grecs", "D'expulser de Rome ceux qui jouissent illégalement du droit de cité", "D'affranchir tous les esclaves", "D'abolir la monarchie", "D'interdire les jeux du cirque"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"tanto conventu ac frequentia hominum\", \"conventu\" est à l'ablatif singulier d'un nom de la...",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "\"perficiam profecto\" est un exemple de...",
          response: ["Allitération en \"p\"", "Assonance en \"e\"", "Anaphore", "Chiasme", "Zeugma"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La phrase \"si non esset\" (à la fin du texte) exprime...",
          response: ["Une condition possible", "Une condition irréelle du présent", "Une condition irréelle du passé", "Un souhait", "Une concession"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "L'utilisation de \"segregandum\" et \"adsciscendum\" (adjectifs verbaux) exprime une nuance d'...",
          response: ["Action en cours", "Action passée", "Obligation", "Action future", "Possibilité"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Selon Cicéron, pour quelle raison principale doit-il défendre Archias ?",
          response: ["Archias est un ami de la famille", "Archias est son maître en éloquence", "Archias est riche et peut le récompenser", "Archias a écrit un poème sur son consulat", "Archias est son frère"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Quantum est situm in nobis\" signifie...",
          response: ["Autant qu'il est en notre pouvoir", "Autant que nous le savons", "Autant que nous le voyons", "Autant que nous le voulons", "Autant que nous le méritons"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "L'expression \"hoc genere dicendi quod abhorreat... a sermone forensi\" montre que Cicéron va utiliser un style...",
          response: ["Judiciaire", "Délibératif", "Nouveau et inhabituel", "Simple et familier", "Poétique"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"humanitatis ac litterarum\", le mot \"humanitas\" signifie...",
          response: ["La bienveillance", "La culture, la civilisation", "L'humanité (genre humain)", "La humanité (vertu morale)", "La charité"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Cicéron fut surnommé \"Pater patriae\" après avoir...",
          response: ["Écrit les Philippiques", "Réprimé la conjuration de Catilina", "Défendu Archias", "Conquis la Gaule", "Été élu consul"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"cuiquam vestrum\", le mot \"vestrum\" est un génitif...",
          response: ["Subjectif", "Objectif", "Partitif", "Possessif", "De qualité"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"loqui paulo liberius\" est un exemple de...",
          response: ["Comparatif atténué", "Superlatif", "Degré zéro", "Comparatif d'égalité", "Superlatif absolu"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "L'exorde du Pro Archia se compose essentiellement de...",
          response: ["Une captatio benevolentiae et une proposition-division", "Une narratio et une refutatio", "Une peroratio et une digressio", "Une énumération des faits et une conclusion", "Une description du client et une liste de ses œuvres"],
          correct_answer: 0,
          time: 45,
        },
      ],
    },
    {
      title: "TEXTE 2 : TACITE, ANNALES IV, 32-33",
      passage: "Annales IV, 32 : Anciens et nouveaux historiens\n\nNon sum nescius pleraque eorum quae retuli et quae referam videri forsitan parva et levia memoratu. Sed nemo contenderit nostros annales cum scriptura eorum qui composuere res veteres populi Romani. Illi bella ingentia, expugnationes urbium, reges fusos et captos, aut, si quando praeverterent ad interna, discordias consulum adversum tribunos, leges agrarias et frumentarias, certamina plebis et optimatium memorabant egressu libero. Labor est nobis ingloriosus et in arto: quippe pax erat immota aut modice lacessita, res urbis maestae et princeps incuriosus proferendi imperii. Tamen non fuerit sine usu introspicere illa levia primo aspectu, ex quibus motus rerum magnarum oriuntur saepe.\n\nAnnales IV, 33 : Malaises du jugement sous le principat\n\nNam, populus aut primores aut singuli regunt cunctas nationes et urbes. Forma rei publicae delecta et consociata ex iis potest laudari facilius quam evenire, vel si evenit, haud potest esse diuturna.\n\nIgitur, ut olim plebe valida vel cum patres pollerent, noscenda natura vulgi et quibus modis temperanter haberetur, et qui perdidicerant maxime ingenia senatus et optimatium, credebantur callidi temporum et sapientes, sic statu converso et re romana non alia quam si unus imperitet, fuerit in rem haec conquirì et tradi, quia pauci discernunt prudentia honesta ab deterioribus, utilia ab noxiis, plures docentur eventis aliorum.\n\nCeterum, ut haec profutura ita adferunt minimum oblectationis. Nam situs gentium, varietates proeliorum, exitus clari ducum retinent ac redintegrant animum legentium. Nos conjungimus iussa saeva, accusationes continuas, amicitias fallaces, perniciem innocentium, et causas easdem exitii, obvia similitudine et satietate rerum.\n\nTum, quod obtrectator rarus scriptoribus antiquis et non refert cujusquam extuleris laetius acies Punicas vel Romanas ; at, posteri multorum qui, Tiberio regente, subiere poenam vel infamiam manent ; utque familiae ipsae sint jam extinctae, reperies qui putent ob similitudinem morum malefacta aliena objectari sibi. Etiam gloria ac virtus habet infensos, ut arguens diversa ex nimis propinquo. Sed redeo ad incepta.",
      questions: [
        {
          text: "Que signifie le mot \"levia\" dans l'expression \"parva et levia memoratu\" ?",
          response: ["Lourdes", "Sérieuses", "Légères, insignifiantes", "Agréables", "Élevées"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"motus rerum magnarum\", que signifie le mot \"motus\" ?",
          response: ["Les mouvements physiques", "Les causes, les révolutions, les troubles", "Les batailles navales", "Les lois agraires", "Les discours politiques"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le verbe \"retinent\" dans \"retinent ac redintegrant animum legentium\" signifie :",
          response: ["Ils rejettent", "Ils fatiguent", "Ils retiennent, captivent", "Ils ennuient", "Ils effacent"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Que signifie \"perniciem innocentium\" ?",
          response: ["La prospérité des innocents", "La ruine, la perte des innocents", "Le salut des innocents", "La gloire des innocents", "L'innocence des justes"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le mot \"obtrectator\" désigne :",
          response: ["Un admirateur", "Un détracteur, un adversaire", "Un historien", "Un empereur", "Un soldat"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie \"egressu libero\" dans \"memorabant egressu libero\" ?",
          response: ["En sortie libre (en toute liberté, libre carrière)", "En sortie forcée", "En prison", "En exil", "En secret"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Non sum nescius\" est une construction grammaticale qui exprime :",
          response: ["Une négation simple", "Une affirmation renforcée par une double négation (litote)", "Un doute", "Une interrogation", "Une concession"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"Nemo contenderit nostros annales\", le verbe \"contenderit\" est un subjonctif. Quelle est sa valeur ?",
          response: ["Subjonctif jussif (ordre)", "Subjonctif potentiel (affirmation atténuée)", "Subjonctif optatif (souhait)", "Subjonctif concessif (concession)", "Subjonctif final (but)"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"si quando praeverterent ad interna\", le subjonctif \"praeverterent\" est un subjonctif :",
          response: ["De répétition (action répétée dans le passé)", "De potentiel", "D'obligation", "De concession", "De souhait"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La proposition \"utque familiae ipsae sint jam extinctae\" est une proposition :",
          response: ["Finale", "Concessive", "Potentielle", "Optative", "Consécutive"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"haud potest esse diuturna\", \"haud\" est un adverbe de négation qui signifie :",
          response: ["Non (renforcé)", "Oui", "Peut-être", "Jamais", "Souvent"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"qui composuere res veteres\" : la forme \"composuere\" est :",
          response: ["Un infinitif parfait", "Un indicatif parfait 3e personne du pluriel (syncopé)", "Un subjonctif présent", "Un futur antérieur", "Un participe passé"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Quelle est la meilleure traduction de \"Labor est nobis ingloriosus et in arto\" ?",
          response: ["Le travail est pour nous sans gloire et dans un domaine restreint", "Notre travail est glorieux et vaste", "Le travail est pour nous pénible et ennuyeux", "Notre travail est sans récompense et difficile", "Le travail est pour nous honorable et facile"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Comment traduire \"Tamen non fuerit sine usu introspicere illa levia primo aspectu\" ?",
          response: ["Cependant il n'aura pas été sans utilité de pénétrer ces faits légers à première vue", "Cependant il sera inutile d'examiner ces faits légers", "Cependant il ne sera pas utile de regarder ces choses insignifiantes", "Cependant il sera dangereux d'étudier ces faits", "Cependant il est inutile d'examiner ces détails"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La traduction de \"pauci discernunt prudentia honesta ab deterioribus\" est :",
          response: ["Peu de gens distinguent avec prudence les choses honorables des choses mauvaises", "Beaucoup de gens confondent l'honnête et le mal", "Personne ne sait distinguer le bien du mal", "Les sages distinguent facilement le bien du mal", "Tous distinguent le bien du mal"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"nos conjungimus iussa saeva, accusationes continuas, amicitias fallaces, perniciem innocentium\" se traduit par :",
          response: ["Nous racontons les ordres cruels, les accusations continuelles, les amitiés trompeuses, la perte des innocents", "Nous séparons les ordres cruels des accusations", "Nous évitons de parler des amitiés trompeuses", "Nous chantons les ordres cruels et les accusations", "Nous dénonçons les ordres et les amitiés"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"expugnationes urbium\" : \"urbium\" est un génitif pluriel. À quelle déclinaison appartient le nom \"urbs\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison (parisyllabique)", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"exitus clari ducum\", le mot \"ducum\" est un génitif pluriel du nom :",
          response: ["Dux, ducis (m.) – 3ème déclinaison", "Ducatus, -us (m.) – 4ème déclinaison", "Duco, -ere (verbe)", "Ductor, -oris (m.) – 3ème déclinaison", "Ducissa, -ae (f.) – 1ère déclinaison"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"iis\" dans \"ex iis\" est un ablatif pluriel du pronom démonstratif :",
          response: ["Hic, haec, hoc", "Ille, illa, illud", "Is, ea, id", "Ipse, ipsa, ipsum", "Idem, eadem, idem"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"noscenda natura vulgi\", \"noscenda\" est un adjectif verbal (gérondif). À quel cas est-il ?",
          response: ["Nominatif singulier féminin", "Accusatif pluriel neutre", "Génitif pluriel", "Datif singulier", "Ablatif singulier"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Cornelius Tacitus est né approximativement :",
          response: ["En 55 av. J.-C.", "En 55 apr. J.-C.", "En 70 av. J.-C.", "En 120 apr. J.-C.", "En 98 av. J.-C."],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Laquelle de ces œuvres n'est PAS de Tacite ?",
          response: ["Les Annales (Ab excessu divi Augusti)", "Les Histoires (Historiae)", "La Germania", "L'Agricola", "La Conjuration de Catilina"],
          correct_answer: 4,
          time: 45,
        },
        {
          text: "Tacite est souvent qualifié par les critiques modernes de :",
          response: ["\"Le père de l'histoire\"", "\"Le plus grand peintre de l'antiquité\" (Racine)", "\"Le Cicéron de son temps\"", "\"Le poète des historiens\"", "\"Le théologien de l'histoire\""],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"bella ingentia, expugnationes urbium, reges fusos et captos\" est un exemple de :",
          response: ["Gradation ascendante", "Gradation descendante", "Accumulation (énumération)", "Hyperbate", "Chiasme"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"nos conjungimus iussa saeva, accusationes continuas, amicitias fallaces, perniciem innocentium\" : la figure de style dominante est :",
          response: ["Anaphore", "Polysyndète", "Asyndète", "Chiasme", "Zeugma"],
          correct_answer: 2,
          time: 45,
        },
      ],
    },
    {
      title: "TEXTE 3 : TITE-LIVE, PRÉFACE D'A.U.C. (AB URBE CONDITA)",
      passage: "Préface : Utilité douteuse et difficultés d'écrire l'histoire de Rome\n\nFacturusne sim operae pretium si a primordio urbis res populi Romani perscripserim, nec satis scio nec, si sciam, dicere ausim, quippe qui videam rem esse cum veterem tum vulgatam, dum scriptores semper novi aut se aliquid certius allaturos aut rudem vetustatem arte scribendi superaturos credunt. Utcumque erit, tamen me iuvabit ipsum consului sse memoriae rerum gestarum principis terrarum populi et, si in tanta scriptorum turba mea fama in obscuro sit, nobilitate ac magnitudine eorum qui officient nomini meo consoler. Praeterea res est operis immensi, ut ea repetatur supra septingentesimum annum et ut a profecta ab initiis exiguis creverit eo ut iam laboret sua magnitudine; et haud dubito quin primae origines et proxima originibus sint praebitura minus voluptatis plerisque legentium, festinantibus ad haec nova, in quibus iam pridem praevalentis populi vires se ipsae conficiunt. Ego contra, quo me a conspectu malorum, quae nostra aetas tot annis vidit, avertam, tantisper certe, dum prisca illa tota mente repeto, omnis curae cogitationemque avertam, quae scribentis animum etsi non flectere a vero, sollicitum tamen efficere posset.\n\nSed, utcumque erunt animadversa aut existimata, haud equidem in magno ponam discrimine. Hoc illud est praecipue salubre ac frugiferum in cognitione rerum, te intueri documenta omnis exempli in monumento illustri posita; inde tibi tuaeque rei publicae quod imitere capias, inde foedum inceptu, foedum exitu quod vites. Nuper divitiae invexere avaritiam et abundantes voluptates desiderium pereundi ac perdendi omnia per luxum atque libidinem. Sed querelae, ne tum quidem gratae, cum erunt forsitan necessariae, absint certe ab initio tantae rei ordiendae.\n\nSi mos esset quoque nobis ut poetis, inciperemus potius libentius cum bonis ominibus et votis et precationibus deorum dearumque, ut darent orsis operis tantum successus prosperos.",
      questions: [
        {
          text: "Que signifie le mot \"vulgatam\" dans \"rem esse cum veterem tum vulgatam\" ?",
          response: ["Cachée, secrète", "Rebattue, connue de tous, banale", "Noble, illustre", "Nouvelle, récente", "Difficile, ardue"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"rudem vetustatem arte scribendi superaturos\", que signifie \"rudem\" ?",
          response: ["Élégante, raffinée", "Brute, grossière, inculte", "Savante, cultivée", "Ancienne, vénérable", "Simple, facile"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le mot \"officient\" dans \"qui officient nomini meo\" signifie :",
          response: ["Ils aident, ils soutiennent", "Ils nuisent, ils font ombrage", "Ils imitent", "Ils louent", "Ils ignorent"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"iam laboret sua magnitudine\", le verbe \"laborare\" signifie :",
          response: ["Travailler", "S'affaiblir, plier sous le poids", "Se réjouir", "Grandir", "Dormir"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie \"documenta omnis exempli\" ?",
          response: ["Des documents officiels", "Des exemples instructifs de toute sorte", "Des preuves juridiques", "Des livres d'histoire", "Des monuments célèbres"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"foedum inceptu, foedum exitu\", le mot \"foedum\" signifie :",
          response: ["Beau, noble", "Honteux, laid, vil", "Courageux", "Heureux", "Sacré"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Luxum atque libidinem\" : \"luxum\" signifie :",
          response: ["La lumière", "Le luxe, la débauche", "La pauvreté", "La sagesse", "La force"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Facturusne sim\" est une forme interrogative indirecte. Quelle est sa valeur ?",
          response: ["Une affirmation catégorique", "Un doute (je me demande si je vais faire)", "Un ordre", "Un souhait", "Une concession"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"nec, si sciam, dicere ausim\", le subjonctif \"ausim\" est :",
          response: ["Un subjonctif présent de audeo (oser) – forme archaïque", "Un subjonctif parfait", "Un indicatif futur", "Un infinitif", "Un participe"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"haud dubito quin primae origines sint praebitura\" : la construction \"quin\" + subjonctif est ici :",
          response: ["Une finale", "Une complétive après un verbe de doute négatif (je ne doute pas que)", "Une concessive", "Une conditionnelle", "Une consécutive"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"avertam, tantisper certe, dum prisca illa tota mente repeto\", la proposition introduite par \"dum\" est :",
          response: ["Une temporelle (pendant que)", "Une causale", "Une finale", "Une conditionnelle", "Une concessive"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"quae scribentis animum etsi non flectere a vero, sollicitum tamen efficere posset\" : \"etsi\" introduit une proposition :",
          response: ["Temporelle", "Concessive", "Causale", "Conditionnelle", "Finale"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Si mos esset quoque nobis ut poetis\" : cette construction exprime :",
          response: ["Une condition réelle", "Une irréalité du présent (si nous avions l'habitude…)", "Une possibilité", "Un ordre", "Un souhait"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Quelle est la meilleure traduction de \"Facturusne sim operae pretium si a primordio urbis res populi Romani perscripserim\" ?",
          response: ["Je vais faire œuvre utile si j'écris l'histoire du peuple romain", "Je me demande si je vais faire quelque chose qui vaille la peine si j'écris l'histoire du peuple romain depuis l'origine de la ville", "Je ferai une œuvre précieuse en écrivant l'histoire de Rome", "Il est inutile d'écrire l'histoire de Rome depuis ses origines", "Je vais écrire l'histoire de Rome sans me poser de questions"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"me iuvabit ipsum consului sse memoriae rerum gestarum principis terrarum populi\" signifie :",
          response: ["Il me sera agréable d'avoir veillé à la mémoire du premier peuple du monde", "Il me sera pénible de me souvenir du premier peuple du monde", "Je serai heureux d'avoir consulté les archives du peuple romain", "Je serai fier d'appartenir au premier peuple du monde", "Il me sera utile d'écrire l'histoire du peuple romain"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Hoc illud est praecipue salubre ac frugiferum in cognitione rerum, te intueri documenta omnis exempli\" se traduit par :",
          response: ["Voilà ce qui est particulièrement salutaire et fécond dans la connaissance des événements, que tu regardes des exemples instructifs de toute sorte", "Voilà ce qui est dangereux dans l'étude de l'histoire", "Il est inutile d'étudier les exemples du passé", "Les exemples historiques sont toujours trompeurs", "L'histoire est une science inutile"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Nuper divitiae invexere avaritiam et abundantes voluptates desiderium pereundi ac perdendi omnia per luxum atque libidinem\" se traduit par :",
          response: ["Récemment les richesses ont engendré l'avarice et les plaisirs surabondants ont engendré le désir de se perdre et de perdre tout par le luxe et la débauche", "Les richesses et les plaisirs ont apporté le bonheur à Rome", "Les richesses ont chassé l'avarice et les plaisirs ont disparu", "Les richesses sont la cause de la vertu romaine", "Le luxe et la débauche ont été bannis de Rome"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"principis terrarum populi\" : \"terrarum\" est un génitif pluriel. À quelle déclinaison appartient le nom \"terra\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"documenta omnis exempli\" : \"exempli\" est un génitif singulier de la :",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"foedum inceptu, foedum exitu\", \"inceptu\" et \"exitu\" sont des ablatifs du supin. À quelle déclinaison appartiennent ces mots ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "\"in tanta scriptorum turba\" : \"scriptorum\" est un génitif pluriel du participe passé substantivé \"scriptor, -oris\". À quelle déclinaison appartient ce nom ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Titus Livius (Tite-Live) est né à :",
          response: ["Rome", "Padoue (Patavium)", "Arpinum", "Milan", "Carthage"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "La principale œuvre de Tite-Live, \"Ab Urbe Condita\", comptait à l'origine :",
          response: ["35 livres", "100 livres", "142 livres", "50 livres", "10 livres"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Tite-Live est contemporain et protégé de l'empereur :",
          response: ["Auguste", "Tibère", "Caligula", "Néron", "Trajan"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La phrase \"foedum inceptu, foedum exitu\" (avec répétition du mot \"foedum\") est un exemple de :",
          response: ["Anaphore", "Épanadiplose", "Parallélisme (et antithèse entre \"inceptu\" et \"exitu\")", "Chiasme", "Zeugma"],
          correct_answer: 2,
          time: 45,
        },
      ],
    },
    {
      title: "TEXTE 4 : TACITE, AGRICOLA I-II-III",
      passage: "§I. Exalter la vertu est chose délicate\n\nQuamquam aetas incuriosa suorum ne omisit quidem nostris temporibus tradere posteris facta et mores virorum clarorum usitatum antiquitus, quotiens aliqua virtus magna ac nobilis vicit et est supergressa vitium commune parvis et magnis civitatibus, ignorantiam recti et invidiam. Sed, ut agere digna memoratu erat in aperto apud priores, ita quisque celeberrimus ducebatur tantum ingenio, sine gratia aut ambitione, pretio bonae conscientiae ad prodendam memoriam virtutis.\n\n§II. Difficultés d'écrire sous la tyrannie\n\nLegimus, cum Aruleno Rustico Paetus Thrasea, Herennio Senecioni Priscus Helvidius laudati essent, capitale fuisse, neque in ipsos modo auctores, sed in libros quoque eorum saevitum, delegato triumviris ministerio ut monumenta clarissimorum ingeniorum in comitio ac foro urerentur. Scilicet arbitrabantur vocem populi Romani et libertatem senatus et conscientiam generis humani aboleri illo igne, insuper professoribus sapientiae expulsis atque omni bona arte in exsilium acta, ne quid honestum occurreret usquam.\n\n§III. Nous avons connu le comble de la servitude\n\nProfecro, dedimus grande documentum patientiae, et sicut vetus aetas vidit quid ultimum esset in libertate, ita nos vidimus quid esset ultimum in servitute, commercio loquendi et audendi adempto etiam per inquisitores. Perdidissemus quoque ipsam memoriam cum voce, si tam esset in nostra potestate oblivisci quam tacere. Nunc demum animus redit. Sed, quamquam Nerva Caesar miscuerit primo statim ortu saeculi beatissimi res olim dissociabiles, principatus ac libertatem, et quamquam Nerva Traianus augeat quotidie felicitatem temporum et securitas publica non modo spem ac votum, sed ipsam fiduciam ac robur assumpserit voti, tamen remedia tardiora sunt quam mala, natura infirmitatis humanae, et, ut nostra corpora augescunt lente, extinguuntur cito, sic ingenia studiaque oppresseris facilius quam revocaveris. Quippe dulcedo inertiae ipsius subit, et desidia, prius visa, amatur postremo. Quid si per quindecim annos, grande mortalis aevi spatium, multi casibus fortuitis, quisque promptissimus saevitia principis interciderunt, pauci, ut ita dixerim, superstites non modo aliorum, sed etiam nostris ipsi superstites sumus, tot annis exemptis e media vita, quibus per silentium venimus ad senectutem, juvenes, senes prope ad ipsos exactae aetatis terminos?",
      questions: [
        {
          text: "Que signifie le mot \"incuriosa\" dans \"aetas incuriosa suorum\" ?",
          response: ["Curieuse, attentive", "Indifférente, négligente", "Passionnée", "Savante", "Respectueuse"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"vitium commune parvis et magnis civitatibus\", le mot \"vitium\" signifie :",
          response: ["La vertu", "La richesse", "Le vice, le défaut", "La puissance", "La gloire"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Que signifie \"conscientiam generis humani\" ?",
          response: ["La conscience morale individuelle", "La conscience du genre humain (témoignage de l'humanité)", "La connaissance des hommes", "La pitié envers les hommes", "L'ignorance des hommes"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"commercio loquendi et audendi adempto\", le mot \"commercium\" signifie :",
          response: ["Le commerce", "La relation, l'échange, la communication", "Le silence", "La liberté", "La parole"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie \"inquisitores\" dans ce contexte ?",
          response: ["Des juges", "Des espions, des délateurs", "Des philosophes", "Des historiens", "Des soldats"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"pauci… superstites sumus\", le mot \"superstites\" signifie :",
          response: ["Supérieurs", "Survivants", "Inférieurs", "Heureux", "Malheureux"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"dulcedo inertiae ipsius\" signifie :",
          response: ["La douceur de l'activité", "La douceur de l'inaction", "L'amertume du travail", "La joie de l'étude", "La peur du silence"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"ne omisit quidem\" est une construction avec \"ne…quidem\". Que signifie-t-elle ?",
          response: ["Non plus", "Pas même, ne…pas même", "Cependant", "En effet", "En outre"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"ut agere digna memoratu erat in aperto apud priores\", le subjonctif \"esset\" (sous-entendu) serait normalement :",
          response: ["Un indicatif", "Un subjonctif de concession", "Un subjonctif de répétition", "Un subjonctif potentiel", "Un subjonctif final"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"capitale fuisse\" : quelle est la nature grammaticale de \"fuisse\" ?",
          response: ["Infinitif présent", "Infinitif parfait", "Infinitif futur", "Participe passé", "Indicatif parfait"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"delegato triumviris ministerio\", le participe \"delegato\" est un ablatif absolu. Quelle est sa valeur ?",
          response: ["Temporelle", "Causale", "Concessive", "Manière", "Conditionnelle"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"ne quid honestum occurreret usquam\" : la proposition introduite par \"ne\" est :",
          response: ["Une finale (pour que rien d'honnête ne se rencontre)", "Une concessive", "Une causale", "Une conditionnelle", "Une temporelle"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"si tam esset in nostra potestate oblivisci quam tacere\", la construction \"si\" + subjonctif est :",
          response: ["Une condition réelle", "Une irréalité du présent", "Une possibilité", "Un souhait", "Une concession"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "La traduction de \"ne omisit quidem nostris temporibus tradere posteris facta et mores virorum clarorum\" est :",
          response: ["Elle n'a pas omis même de notre temps de transmettre à la postérité les faits et les mœurs des hommes illustres", "Elle a omis de transmettre à la postérité les faits des hommes illustres", "Elle n'a pas transmis les faits des hommes illustres", "Elle a transmis les faits des hommes illustres à notre époque", "Elle a oublié de transmettre les mœurs des hommes célèbres"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"non in ipsos modo auctores, sed in libros quoque eorum saevitum\" se traduit par :",
          response: ["On a sévi non seulement contre les auteurs eux-mêmes, mais aussi contre leurs livres", "On a sévi seulement contre les auteurs, pas contre leurs livres", "On a épargné les auteurs mais pas leurs livres", "On a brûlé les livres et épargné les auteurs", "On a puni les auteurs et leurs livres de la même manière"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"dedimus grande documentum patientiae\" signifie :",
          response: ["Nous avons donné une grande leçon de patience", "Nous avons reçu une grande leçon de patience", "La patience nous a été donnée", "Nous avons perdu la patience", "La patience est un grand document"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"ut nostra corpora augescunt lente, extinguuntur cito, sic ingenia studiaque oppresseris facilius quam revocaveris\" se traduit par :",
          response: ["Comme nos corps se développent lentement et dépérissent vite, ainsi on étouffe les talents et les études plus facilement qu'on ne les ranime", "Comme nos corps se développent vite et dépérissent lentement, ainsi on ranime les études plus facilement qu'on ne les étouffe", "Les talents se développent comme les corps", "Les études sont éternelles comme les corps", "On étouffe et on ranime les études avec la même facilité"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"virtus, virtutis\" : à quelle déclinaison appartient ce nom ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"ingeniorum\" est un génitif pluriel du nom \"ingenium, -ii\". À quelle déclinaison appartient ce nom ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"in comitio ac foro\", \"comitio\" et \"foro\" sont à l'ablatif singulier. À quelle déclinaison appartiennent ces noms ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"in exsilium acta\" : \"exsilium\" est à l'accusatif singulier. À quelle déclinaison appartient ce nom ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "L'Agricola de Tacite a été publié approximativement en :",
          response: ["80 apr. J.-C.", "98 apr. J.-C.", "106 apr. J.-C.", "117 apr. J.-C.", "70 apr. J.-C."],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le texte de l'Agricola est à la fois :",
          response: ["Un panégyrique d'Agricola et un pamphlet contre Domitien", "Une biographie de Domitien et une histoire de la Bretagne", "Un traité philosophique et un poème épique", "Une satire et une comédie", "Une oraison funèbre et une géographie de Rome"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Le Dialogue des Orateurs (Dialogus de Oratoribus) est une œuvre :",
          response: ["Historique sur les Germains", "Littéraire sur l'éloquence et la poésie", "Politique sur la tyrannie", "Philosophique sur le stoïcisme", "Biographique sur Agricola"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"vocem populi Romani et libertatem senatus et conscientiam generis humani\" (répétition de \"et\") est un exemple de :",
          response: ["Asyndète", "Polysyndète", "Anaphore", "Chiasme", "Zeugma"],
          correct_answer: 1,
          time: 45,
        },
      ],
    },
    {
      title: "TEXTE 5 : SALLUSTE, DE CONJURATIONE CATILINAE I-IV",
      passage: "§I. La recherche de la gloire\n\nOmnis homines, qui sese student praestare ceteris animalibus, summa ope niti decet ne vitam silentio transeant veluti pecora, quae natura prona atque ventri oboedientia finxit. Sed omnis nostra vis in animo et corpore sita est; animi imperio, corporis servitio magis utimur; alterum nobis cum dis, alterum cum beluis commune est. Quo mihi rectius videtur ingeni quam virium opibus gloriam quaerere et, quoniam vita ipsa, qua fruimur, brevis est, memoriam nostri quam maxume longam efficere. Nam divitiarum et formae gloria fluxa atque fragilis est, virtus clara aeternaque habetur.\n\n§II. Comment chercher la vraie gloire ?\n\nSed, ubi pro labore desidia, pro continentia et aequitate lubido atque superbia invasere, fortuna simul cum moribus inmutatur. Ita imperium semper ad optimum quemque a minus bono transfertur. Sed multi mortales, dediti ventri atque somno, indocti incultique vitam sicuti peregrinantes transiere; quibus profecto contra naturam corpus voluptati, anima oneri fuit. Ego aestumo vitam et mortem eorum proinde esse, quoniam de utraque siletur. Verum enimvero is demum mihi vivere atque frui anima videtur, qui aliquo negotio intentus praeclari facinoris aut bonae artis famam sibi quaerit.\n\n§III. Confidences sur la vie politique\n\nSed ego adulescentulus initio, sicuti plerique, studio ad rem publicam latus sum, ibique mihi multa advorsa fuere. Nam pro pudore, pro abstinentia, pro virtute audacia, largitio, avaritia vigebant. Et, tametsi animus, insolens malarum artium, aspernabatur ea, tamen inter tanta vitia imbecilla aetas ambitione corrupta tenebatur.\n\n§IV. Le choix du sujet\n\nIgitur, ubi animus requievit ex multis miseris atque periculis, statui mihi reliquam aetatem a re publica procul habendam. Neque vero agrum colundo aut venando, servilibus officiis, aetatem agere, sed res gestas populi Romani carptim, ut quaeque memoria digna videbantur, perscribere, eo magis quod animus erat liber a spe, metu, partibus. Igitur de Catilinae conjuratione quam verissume potero paucis absolvam. Nam id facinus in primis memorabile est sceleris atque periculi novitate.",
      questions: [
        {
          text: "Que signifie le verbe \"nitī\" dans \"summa ope niti decet\" ?",
          response: ["Nager", "S'efforcer, tendre vers", "Nier", "Louer", "Ignorer"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"ne vitam silentio transeant\", le mot \"silentio\" signifie :",
          response: ["En silence, dans l'obscurité (sans laisser de trace)", "Avec bruit", "Avec gloire", "En paix", "Avec crainte"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Que signifie \"prona\" dans \"quae natura prona atque ventri oboedientia finxit\" ?",
          response: ["Penchée vers la terre, courbée", "Élevée, noble", "Rapide", "Lourde", "Légère"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"divitiarum et formae gloria fluxa atque fragilis est\" : \"fluxa\" signifie :",
          response: ["Solide, durable", "Fluide, fragile, changeante", "Éternelle", "Lumineuse", "Puissante"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"pro continentia et aequitate lubido atque superbia invasere\", le mot \"lubido\" signifie :",
          response: ["La mesure", "La débauche, le désir effréné", "La sagesse", "La pauvreté", "La vertu"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"indocti incultique\" : ces deux adjectifs signifient respectivement :",
          response: ["Instruits et cultivés", "Sans instruction et sans culture", "Riches et puissants", "Sages et vertueux", "Paresseux et gourmands"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie \"carptim\" dans \"res gestas populi Romani carptim perscribere\" ?",
          response: ["Par morceaux détachés, par épisodes choisis", "Complètement, entièrement", "Rapidement", "Avec soin", "Avec hésitation"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Omnis homines\" est une forme archaïque. La forme classique correcte est :",
          response: ["Omnes homines", "Omnium hominum", "Omni homine", "Omnibus hominibus", "Omnia homina"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"qui sese student praestare ceteris animalibus\", le verbe \"student\" est suivi :",
          response: ["D'un infinitif (praestare)", "D'un subjonctif", "D'un gérondif", "D'un participe", "D'un supin"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"animi imperio, corporis servitio magis utimur\" : \"imperio\" et \"servitio\" sont à l'ablatif. Quelle est leur fonction ?",
          response: ["Ablatif de moyen", "Ablatif de cause", "Ablatif de manière", "Ablatif de temps", "Ablatif de lieu"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"memoriam nostri quam maxume longam efficere\", \"nostri\" est un génitif :",
          response: ["Subjectif", "Objectif", "Partitif", "Possessif", "De qualité"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"fortuna simul cum moribus inmutatur\" : le verbe \"inmutatur\" est à l'indicatif présent passif. Il signifie :",
          response: ["Est changé, est modifié", "Change (actif)", "A changé", "Sera changé", "A été changé"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Ego aestumo vitam et mortem eorum proinde esse, quoniam de utraque siletur\" : \"siletur\" est un impersonnel passif. Il signifie :",
          response: ["On est silencieux", "On se tait", "On parle", "On est loué", "On est oublié"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "La traduction de \"omnis homines, qui sese student praestare ceteris animalibus, summa ope niti decet\" est :",
          response: ["Tous les hommes qui aspirent à se montrer supérieurs aux autres animaux doivent s'efforcer de toutes leurs forces", "Tous les hommes qui aiment les animaux doivent les protéger", "Les hommes sont supérieurs aux animaux par nature", "Les hommes doivent obéir aux animaux", "Les hommes et les animaux sont égaux"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"alterum nobis cum dis, alterum cum beluis commune est\" se traduit par :",
          response: ["L'un est commun à nous avec les dieux, l'autre avec les bêtes", "L'un est pour les dieux, l'autre pour les bêtes", "L'un est commun aux dieux, l'autre aux bêtes", "Les dieux et les bêtes nous sont communs", "Nous partageons tout avec les dieux et les bêtes"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"verum enimvero is demum mihi vivere atque frui anima videtur, qui aliquo negotio intentus praeclari facinoris aut bonae artis famam sibi quaerit\" se traduit par :",
          response: ["Mais en réalité, celui-là seul me paraît vivre et jouir de ses facultés, qui, appliqué à quelque affaire, cherche par une action éclatante ou un beau talent la renommée", "Celui qui cherche la renommée ne vit pas vraiment", "La vie n'a de sens que pour les riches", "Les affaires publiques sont la seule voie vers la gloire", "Les talents sont inutiles sans la renommée"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"sed res gestas populi Romani carptim, ut quaeque memoria digna videbantur, perscribere\" se traduit par :",
          response: ["Mais écrire l'histoire du peuple romain par épisodes choisis, selon que les événements semblaient dignes de mémoire", "Mais écrire toute l'histoire du peuple romain sans exception", "Mais ne pas écrire l'histoire du peuple romain", "Mais écrire seulement les batailles du peuple romain", "Mais écrire l'histoire du peuple romain en vers"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"ceteris animalibus\" : \"animalibus\" est un datif pluriel. À quelle déclinaison appartient \"animal, -alis\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison (imparisyllabique)", "3ème déclinaison (parisyllabique)", "4ème déclinaison"],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "\"divitiarum\" est un génitif pluriel. À quelle déclinaison appartient \"divitiae, -arum\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"invasere\" est une forme syncopée. La forme complète est :",
          response: ["Invaserunt", "Invadunt", "Invasi sunt", "Invaverunt", "Invaserant"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"multis miseris atque periculis\" : \"miseris\" et \"periculis\" sont à l'ablatif pluriel. \"Periculum, -i\" est de la :",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Caius Sallustius Crispus (Salluste) est né en :",
          response: ["106 av. J.-C.", "86 av. J.-C.", "70 av. J.-C.", "43 av. J.-C.", "59 av. J.-C."],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Laquelle de ces œuvres N'EST PAS de Salluste ?",
          response: ["La Conjuration de Catilina", "La Guerre de Jugurtha", "Les Histoires", "Le Bellum Africum", "Les Histoires (Historiarum libri V)"],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "Salluste est mort en :",
          response: ["63 av. J.-C.", "44 av. J.-C.", "35 av. J.-C.", "17 av. J.-C.", "40 av. J.-C."],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "\"pro pudore, pro abstinentia, pro virtute audacia, largitio, avaritia vigebant\" est un exemple de :",
          response: ["Anaphore avec \"pro\" et antithèse entre les termes", "Chiasme pur", "Zeugma", "Asyndète seulement", "Hyperbate"],
          correct_answer: 0,
          time: 45,
        },
      ],
    },
    {
      title: "TEXTE 6 : SAINT AUGUSTIN, DE CIVITATE DEI V, 21-22",
      passage: "§21. Dieu dirige l'histoire\n\nEt cum ea sint ita, tribuamus potestatem dandi regni atque imperii non nisi Deo vero, qui dat felicitatem in regno caelorum solis piis, regnum terrenum et piis et impiis, sicut placet ei, cui nihil injuste placet. Enim, quamvis dixerimus aliquid quod esse appertum nobis voluit, tamen est multum ad nos et superat valde nostras vires discutere occulta hominum et dijudicare merita regnorum liquido examine.\n\nIgitur ille unus verus Deus, qui non deserit genus humanum nec judicio nec adjutorio, quando voluit et quantum voluit, dedit regnum Romanis; qui dedit Assyriis vel etiam Persis, a quibus litterae istorum continent solos duos deos coli, unum bonum, alterum malum, ut taceam de populo Hebraeo, de quo jam dixi quantum visum satis, qui non coluit praeter unum Deum et quando regnavit. Is dedit segetes Persis sine cultu deae Segetiae, qui dedit alia dona terrarum sine cultu tot deorum, quos ipsi praeposuerunt singulos rebus singulis vel etiam plures rebus singulis; etiam ipse dedit regnum sine cultu eorum, per quorum cultum isti crediderunt se regnasse.\n\nSic etiam dedit hominibus: qui dedit Mario, qui dedit Gaio Caesari et ipse dedit regnum Neroni, qui dedit Vespasianis vel patri, vel filio, imperatoribus suavissimis, et ipse dedit Domitiano crudelissimo, et ne sit necesse ire per singulos, qui dedit Juliano Apostatae, cujus curiositas sacrilega et detestanda decepit indolem egregiam amore dominandi. Plane unus verus Deus regit et gubernat haec ut placet et sic causis occultis, numquid injustis?\n\n§22. Dieu dirige la durée des guerres\n\nSic etiam tempora ipsa bellorum, sicut est in arbitrio ejus et in justo judicio et misericordia, vel adterere vel consolari genus humanum, ut alia finiantur citius, alia tardius. Bellum piratarum a Pompeio, tertium bellum Punicum a Scipione sunt confecta celeritate incredibili et brevitate temporis. Quoque bellum gladiatorum fugitivorum, quamvis Italia contrita atque vastata horribiliter, multis ducibus Romanis et duobus consulibus victis, tamen est consumptum tertio anno post multa consumpta. Sed secundum bellum Punicum extenuavit et paene consumpsit vires Romanas per decem et octo annos cum maximis detrimentis et calamitate rei publicae; ferme septuaginta milia Romanorum ceciderunt duobus proeliis. Primum bellum Punicum est peractum per viginti et tres annos; bellum Mithridaticum per quadraginta annos.\n\nAc ne quisquam arbitretur rudimenta Romanorum fuisse fortiora ad bella peragenda citius, bellum Samniticum est tractum ferme quinquaginta annis, temporibus superioribus multum laudatis in omni virtute; in quo bello Romani sunt ita victi, ut mitterentur etiam sub jugum. Sed, quia non diligebant gloriam propter justitiam, sed videbantur diligere justitiam propter gloriam, ruperunt pacem factam et foedus. Igitur recolant qui legerunt quam bella dinturna, quam eventis variis, quam cladibus luctuosis sint gesta a Romanis veteribus, sicut orbis terrarum solet jactari velut pelagus procellosissimum tempestate varia talium malorum, et fateantur aliquando quod nolunt, et non interimant se linguis insanis adversus Deum, et non decipiant imperitos.",
      questions: [
        {
          text: "Que signifie \"impiis\" dans \"regnum terrenum et piis et impiis\" ?",
          response: ["Les pieux, les justes", "Les impies, les injustes", "Les pauvres", "Les riches", "Les étrangers"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"cui nihil injuste placet\", le verbe \"placet\" signifie :",
          response: ["Il déplaît", "Il plaît, il est agréable", "Il ordonne", "Il interdit", "Il ignore"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Que signifie \"discutere occulta hominum\" ?",
          response: ["Révéler les secrets des hommes", "Examiner, pénétrer les mystères des hommes", "Cacher les secrets des hommes", "Ignorer les mystères des hommes", "Condamner les actions des hommes"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"curiositas sacrilega et detestanda\", \"sacrilega\" signifie :",
          response: ["Sacrée, pieuse", "Sacrilège, impie", "Curieuse", "Noble", "Merveilleuse"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"adterere vel consolari genus humanum\" : \"adterere\" signifie :",
          response: ["Consoler, réconforter", "Accabler, éprouver, affaiblir", "Élever, glorifier", "Protéger, défendre", "Ignorer, négliger"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"Italia contrita atque vastata\", \"contrita\" signifie :",
          response: ["Consolée", "Accablée, ravagée, brisée", "Élevée", "Protégée", "Illustrée"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"cladibus luctuosis\" : \"clades\" signifie :",
          response: ["Des victoires", "Des défaites, des désastres", "Des richesses", "Des honneurs", "Des prières"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"quamvis dixerimus aliquid\", \"quamvis\" introduit une proposition :",
          response: ["Concessive (bien que, quoique)", "Causale", "Finale", "Conditionnelle", "Temporelle"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"tribuamus potestatem dandi regni\" : \"dandi\" est un gérondif. Quelle est sa fonction ?",
          response: ["Complément d'objet direct", "Complément du nom \"potestatem\" (pouvoir de donner)", "Sujet", "Attribut", "Complément circonstanciel"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Dans \"ut taceam de populo Hebraeo\", le subjonctif \"taceam\" est :",
          response: ["Un subjonctif final", "Un subjonctif de concession", "Un subjonctif optatif (souhait)", "Un subjonctif potentiel", "Un subjonctif jussif"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"ne sit necesse ire per singulos\" : la proposition introduite par \"ne\" est :",
          response: ["Une finale négative (pour qu'il ne soit pas nécessaire)", "Une concessive", "Une causale", "Une conditionnelle", "Une temporelle"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Dans \"ut mitterentur etiam sub jugum\", le subjonctif \"mitterentur\" est :",
          response: ["Un subjonctif final", "Un subjonctif consécutif (de telle sorte qu'ils fussent envoyés)", "Un subjonctif concessif", "Un subjonctif potentiel", "Un subjonctif optatif"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"neque…nec\" dans \"neque judicio nec adjutorio\" est une construction de :",
          response: ["Coordination négative (ni…ni)", "Coordination positive", "Subordination", "Opposition", "Condition"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "La traduction de \"tribuamus potestatem dandi regni atque imperii non nisi Deo vero\" est :",
          response: ["Attribuons le pouvoir de donner le royaume et l'empire au seul Dieu véritable", "Refusons à Dieu le pouvoir de donner les royaumes", "Les rois ont le pouvoir de donner des empires", "Le pouvoir appartient aux hommes", "Donnons le pouvoir aux rois"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"est multum ad nos et superat valde nostras vires discutere occulta hominum\" se traduit par :",
          response: ["Il est très difficile pour nous et dépasse de beaucoup nos forces de sonder les secrets des hommes", "Il est facile de connaître les secrets des hommes", "Les secrets des hommes sont connus de tous", "Nous pouvons facilement juger les hommes", "Les forces humaines sont illimitées"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"Plane unus verus Deus regit et gubernat haec ut placet\" signifie :",
          response: ["Sans doute l'unique vrai Dieu régit et gouverne ces choses comme il lui plaît", "Les dieux gouvernent le monde", "Le hasard gouverne le monde", "L'homme est maître de son destin", "Les empereurs gouvernent avec l'aide des dieux"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"ut alia finiantur citius, alia tardius\" se traduit par :",
          response: ["De sorte que les unes prennent fin plus tôt, les autres plus tardivement", "Toutes les guerres finissent en même temps", "Les guerres finissent toujours vite", "Les guerres ne finissent jamais", "Les guerres finissent par la victoire"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "\"caelorum\" est un génitif pluriel. À quelle déclinaison appartient \"caelum, -i\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"potestatem\" est un accusatif singulier. À quelle déclinaison appartient \"potestas, -atis\" ?",
          response: ["1ère déclinaison", "2ème déclinaison", "3ème déclinaison", "4ème déclinaison", "5ème déclinaison"],
          correct_answer: 2,
          time: 45,
        },
        {
          text: "Dans \"segetes\", le nominatif singulier est :",
          response: ["Segeta", "Seges, -etis", "Segetum", "Segeti", "Segete"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "\"Mario\" est un datif singulier. Le nominatif singulier de ce nom est :",
          response: ["Marius, -ii", "Maria, -ae", "Marius, -i", "Marium", "Mari"],
          correct_answer: 0,
          time: 45,
        },
        {
          text: "Saint Augustin est né à :",
          response: ["Rome", "Thagaste (en Numidie)", "Milan", "Carthage", "Hippone"],
          correct_answer: 1,
          time: 45,
        },
        {
          text: "Le De Civitate Dei a été écrit en réponse :",
          response: ["À la prise de Rome par les Wisigoths d'Alaric en 410", "À la persécution des chrétiens sous Dioclétien", "Aux attaques des païens contre le christianisme", "À la fois A et C", "À la fois B et C"],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "Saint Augustin est mort en :",
          response: ["387 apr. J.-C.", "395 apr. J.-C.", "410 apr. J.-C.", "430 apr. J.-C.", "354 apr. J.-C."],
          correct_answer: 3,
          time: 45,
        },
        {
          text: "\"sicut orbis terrarum solet jactari velut pelagus procellosissimum tempestate varia talium malorum\" est un exemple de :",
          response: ["Métaphore filée (comparaison entre l'histoire du monde et une mer agitée)", "Personnification", "Hyperbole", "Oxymore", "Chiasme"],
          correct_answer: 0,
          time: 45,
        },
      ],
    },
  ],
};

async function main() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [Section, Course, Level, Modele, Question],
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  await sequelize.authenticate();
  const transaction = await sequelize.transaction();

  try {
    const section = await Section.findByPk(latinCourseSeed.section_id, {
      transaction,
    });
    if (!section) {
      throw new Error(
        `Section ${latinCourseSeed.section_id} not found. Run npm run db:seed:sections first.`,
      );
    }

    const existingCourse = await Course.findOne({
      where: {
        name: latinCourseSeed.course,
        section_id: latinCourseSeed.section_id,
      },
      transaction,
    });

    const course =
      existingCourse ??
      (await Course.create(
        {
          name: latinCourseSeed.course,
          section_id: latinCourseSeed.section_id,
        },
        { transaction },
      ));

    if (existingCourse) {
      const existingLevels = await Level.findAll({
        where: { course_id: course.id },
        transaction,
      });
      const levelIds = existingLevels.map((level) => level.id);
      if (levelIds.length > 0) {
        const removedQuestions = await Question.destroy({
          where: { level_id: levelIds },
          transaction,
        });
        console.log(`Removed ${removedQuestions} Latin questions`);
        const removedLevels = await Level.destroy({
          where: { course_id: course.id },
          transaction,
        });
        console.log(`Removed ${removedLevels} Latin levels`);
      }
      console.log(`Reusing Latin course ${course.id}`);
    } else {
      console.log(`Created course Latin (${course.id})`);
    }

    const existingModele = await Modele.findOne({
      where: { title: latinCourseSeed.modele_title },
      transaction,
    });
    const modele =
      existingModele ??
      (await Modele.create(
        {
          title: latinCourseSeed.modele_title,
          pin: false,
          auto_scroll: false,
          is_public: true,
        },
        { transaction },
      ));
    if (!existingModele) {
      console.log(`Created modele ${modele.id}`);
    }

    let levelCount = 0;
    let questionCount = 0;

    for (const levelSeed of latinCourseSeed.levels) {
      const level = await Level.create(
        {
          course_id: course.id,
          title: levelSeed.title,
          passage: levelSeed.passage,
        },
        { transaction },
      );
      levelCount += 1;

      if (levelSeed.questions.length === 0) {
        continue;
      }

      await Question.bulkCreate(
        levelSeed.questions.map((question) => ({
          text: question.text,
          response: question.response,
          correct_answer: question.correct_answer,
          time: question.time,
          level_id: level.id,
          modele_id: modele.id,
        })),
        { transaction },
      );
      questionCount += levelSeed.questions.length;
    }

    await transaction.commit();
    console.log(
      `Seeded Latin: ${levelCount} levels, ${questionCount} questions for section ${latinCourseSeed.section_id}`,
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

