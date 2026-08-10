import { describe, expect, it } from 'vite-plus/test';
import { educationEntries, speakingEntries, volunteeringEntries, workEntries } from './resume';

describe('resume content loader', () => {
  it('loads every work entry file', () => {
    expect(workEntries).toHaveLength(7);
  });

  it('sorts entries oldest-first by start date', () => {
    for (let i = 1; i < workEntries.length; i++) {
      expect(workEntries[i].start >= workEntries[i - 1].start).toBe(true);
    }
  });

  it('renders markdown body content to HTML when present', () => {
    const telerik = workEntries.find((entry) => entry.organization === 'Telerik');
    expect(telerik?.contentHtml).toContain('<li>');
    expect(telerik?.contentHtml).toContain('Collaborated with designers in Bulgaria');
  });

  it('leaves contentHtml undefined for entries with no body', () => {
    const firstEnergy = workEntries.find((entry) => entry.organization === 'FirstEnergy Corp.');
    expect(firstEnergy?.contentHtml).toBeUndefined();
  });

  it('preserves the "present" end sentinel for the current role', () => {
    const current = workEntries.find((entry) => entry.organization === 'Expel');
    expect(current?.end).toBe('present');
  });

  it('loads education, speaking, and volunteering collections too', () => {
    expect(educationEntries).toHaveLength(2);
    expect(speakingEntries).toHaveLength(3);
    expect(volunteeringEntries).toHaveLength(7);
  });

  it('preserves quoted frontmatter values with internal colons', () => {
    const talk = speakingEntries.find((entry) => entry.title.startsWith('From Red to Green'));
    expect(talk?.title).toBe(
      'From Red to Green and the Confusion Between: An Exploration of Color Accessibility'
    );
  });
});
