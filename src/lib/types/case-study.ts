export interface CaseStudyPerson {
  name: string;
  link?: string;
}

export interface CaseStudyMetadata {
  title: string;
  description: string;
  slug: string;
  hero: string;
  heroTitle: string;
  downloadFile?: string;
  team: CaseStudyPerson[];
  responsibilities: string[];
  tools: CaseStudyPerson[];
}
