/**
 * Tests for JWT secret policy in production: should throw on missing/weak secrets.
 */

describe('JWT secret policy (production)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('throws when JWT_SECRET is missing in production', () => {
    process.env.NODE_ENV = 'production';
    // Set empty strings to prevent dotenv from repopulating values from .env
    process.env.JWT_SECRET = '';
    process.env.REFRESH_JWT_SECRET = '';
    jest.isolateModules(() => {
      expect(() => require('../config').default).toThrow(/ausente|muito curta|inseguro|padrão/i);
    });
  });

  it('throws when JWT_SECRET is too short in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    process.env.REFRESH_JWT_SECRET = 'short';
    jest.isolateModules(() => {
      expect(() => require('../config').default).toThrow(/muito curta/i);
    });
  });

  it('throws when JWT_SECRET uses insecure default in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'dev-secret-change-me';
    process.env.REFRESH_JWT_SECRET = 'dev-secret-change-me';
    jest.isolateModules(() => {
      // Depending on length check or default check, accept either message
      expect(() => require('../config').default).toThrow(/muito curta|inseguro|padrão/i);
    });
  });

  it('passes when strong secrets are provided in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'x'.repeat(40);
    process.env.REFRESH_JWT_SECRET = 'y'.repeat(48);
    jest.isolateModules(() => {
      expect(() => require('../config').default).not.toThrow();
    });
  });
});
