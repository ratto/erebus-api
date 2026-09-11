import { describe, expect, it } from 'vitest';

import { skillListQuerySchema } from './skill.schema';

describe('skillListQuerySchema', () => {
  it('accepts an empty query, meaning the whole catalogue', () => {
    expect(skillListQuerySchema.parse({})).toEqual({});
  });

  it('trims the name filter', () => {
    expect(skillListQuerySchema.parse({ name: '  condu  ' })).toMatchObject({ name: 'condu' });
  });

  it('rejects an empty name filter', () => {
    expect(skillListQuerySchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('coerces sourceLevel to a number', () => {
    expect(skillListQuerySchema.parse({ sourceLevel: '2' })).toMatchObject({ sourceLevel: 2 });
  });

  it('rejects a source level outside 1..3, so level 4 can never be queried', () => {
    expect(skillListQuerySchema.safeParse({ sourceLevel: '4' }).success).toBe(false);
  });

  it('accepts a canonical base attribute', () => {
    expect(skillListQuerySchema.parse({ baseAttribute: 'AGI' })).toMatchObject({
      baseAttribute: 'AGI',
    });
  });

  it('rejects an unknown base attribute', () => {
    expect(skillListQuerySchema.safeParse({ baseAttribute: 'XYZ' }).success).toBe(false);
  });

  it('maps rootOnly=true to the boolean true', () => {
    expect(skillListQuerySchema.parse({ rootOnly: 'true' })).toMatchObject({ rootOnly: true });
  });

  it('maps rootOnly=false to the boolean false, not to true', () => {
    expect(skillListQuerySchema.parse({ rootOnly: 'false' })).toMatchObject({ rootOnly: false });
  });

  it('rejects a rootOnly value that is neither true nor false', () => {
    expect(skillListQuerySchema.safeParse({ rootOnly: '1' }).success).toBe(false);
  });

  it('rejects an unknown query parameter', () => {
    expect(skillListQuerySchema.safeParse({ bogus: '1' }).success).toBe(false);
  });
});
