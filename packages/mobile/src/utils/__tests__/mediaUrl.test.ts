import { toAbsoluteMediaUrl } from '@/utils/mediaUrl';
import api from '@/services/api';

// Helper to temporarily set baseURL for tests
function withBaseUrl<T>(baseURL: string, fn: () => T): T {
  const prev = api.defaults.baseURL as any;
  (api.defaults as any).baseURL = baseURL;
  try {
    return fn();
  } finally {
    (api.defaults as any).baseURL = prev;
  }
}

describe('toAbsoluteMediaUrl', () => {
  it('returns absolute URL as-is', () => {
    const input = 'https://cdn.example.com/img.jpg';
    const out = withBaseUrl('http://192.168.15.12:4000/api', () => toAbsoluteMediaUrl(input));
    expect(out).toBe(input);
  });

  it('prefixes origin for relative URL starting with /', () => {
    const out = withBaseUrl('http://192.168.1.12:4000/api', () => toAbsoluteMediaUrl('/api/upload/file/123'));
    expect(out).toBe('http://192.168.1.12:4000/api/upload/file/123');
  });

  it('adds slash when relative URL does not start with /', () => {
    const out = withBaseUrl('http://192.168.1.12:4000/api', () => toAbsoluteMediaUrl('api/upload/file/123'));
    expect(out).toBe('http://192.168.1.12:4000/api/upload/file/123');
  });

  it('works when baseURL has no /api suffix', () => {
    const out = withBaseUrl('http://localhost:3000', () => toAbsoluteMediaUrl('/api/upload/file/abc'));
    expect(out).toBe('http://localhost:3000/api/upload/file/abc');
  });

  it('returns undefined for falsy inputs', () => {
    // @ts-expect-error testing null/undefined
    expect(toAbsoluteMediaUrl(undefined)).toBeUndefined();
    // @ts-expect-error testing null
    expect(toAbsoluteMediaUrl(null)).toBeUndefined();
  });
});
