import { describe, expect, it } from 'vitest';
import { getGlossaryEntry, glossary } from './glossary';

describe('canonical glossary', () => {
  it('has stable unique IDs for links and peeks', () => {
    const ids = glossary.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('serves the same canonical entry to inline peeks and the glossary page', () => {
    const entry = getGlossaryEntry('server-sent-events');
    expect(entry.term).toBe('服务端事件流');
    expect(entry.english).toContain('Server-Sent Events');
  });
});
