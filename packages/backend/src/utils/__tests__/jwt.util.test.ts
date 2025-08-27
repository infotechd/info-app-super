import jwt from 'jsonwebtoken';

describe('utils/jwt - verification and rotation', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('accepts HS256 tokens and rejects other algorithms', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'a'.repeat(40);
    const { verifyJwtWithRotation } = require('../jwt');
    const config = require('../../config').default;

    const hs256 = jwt.sign({ userId: 'u1' }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    const decoded: any = verifyJwtWithRotation(hs256);
    expect(decoded.userId).toBe('u1');

    const hs512 = jwt.sign({ userId: 'u1' }, config.JWT_SECRET, { algorithm: 'HS512', expiresIn: '1h' });
    expect(() => verifyJwtWithRotation(hs512)).toThrow();
  });

  it('verifies with previous secret when rotation is configured', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'current-secret-'.padEnd(40, 'x');
    process.env.JWT_SECRET_PREVIOUS = 'previous-secret-'.padEnd(40, 'y');

    const { verifyJwtWithRotation } = require('../jwt');
    const config = require('../../config').default;

    // Sign token with previous secret; verification should succeed via rotation fallback
    const tokenPrev = jwt.sign({ userId: 'u2' }, config.JWT_SECRET_PREVIOUS, { algorithm: 'HS256', expiresIn: '1h' });
    const decodedPrev: any = verifyJwtWithRotation(tokenPrev);
    expect(decodedPrev.userId).toBe('u2');
  });
});
