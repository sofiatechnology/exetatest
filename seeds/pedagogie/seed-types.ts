export interface SeedQuestion {
  question: string;
  options: string[];
  /** 0-based index of the correct option. Schoolap does not publish the key. */
  answer: number;
}

export interface SeedCourse {
  course: string;
  passage: string | null;
  questions: SeedQuestion[];
}

export interface SeedItem {
  type: 'cg' | 'sc' | 'co' | 'la';
  sources: string[];
  courses: SeedCourse[];
}

export interface YearSeed {
  sectionId: '16';
  year: number;
  items: SeedItem[];
}
