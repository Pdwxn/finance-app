import { describe, it, expect } from 'vitest';
import { toCents, fromCents, formatCLP, formatDate, generateUUID } from '../index';

describe('toCents', () => {
  it('converts integer dollars to cents', () => {
    expect(toCents(150)).toBe(15000);
  });

  it('converts decimal dollars to cents', () => {
    expect(toCents(150.5)).toBe(15050);
  });

  it('handles zero', () => {
    expect(toCents(0)).toBe(0);
  });

  it('rounds to nearest cent', () => {
    expect(toCents(150.999)).toBe(15100);
  });
});

describe('fromCents', () => {
  it('converts cents to dollars', () => {
    expect(fromCents(15000)).toBe(150);
  });

  it('handles zero', () => {
    expect(fromCents(0)).toBe(0);
  });

  it('handles cents with decimals', () => {
    expect(fromCents(15050)).toBe(150.5);
  });
});

describe('formatCLP', () => {
  it('formats cents as CLP currency', () => {
    const result = formatCLP(150000);
    expect(result).toContain('$');
    expect(result).toContain('1.500');
  });

  it('handles zero', () => {
    const result = formatCLP(0);
    expect(result).toContain('$');
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD to Spanish locale', () => {
    const result = formatDate('2026-01-10');
    expect(result).toContain('10');
    expect(result).toContain('ene');
    expect(result).toContain('2026');
  });
});

describe('generateUUID', () => {
  it('generates a valid UUID v4', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('generates unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });
});
