export interface ResumeEntryData {
  title: string;
  /** ISO date string. Entries are expected oldest-first; components reverse for display. */
  start: string;
  /** ISO date string, or the literal "present". */
  end?: string;
  organization?: string;
  organizationUrl?: string;
  location?: string;
  contentHtml?: string;
}
