import { getUserTipoLabel, userTipoLabel } from '@/utils/labels';

describe('labels - user tipo', () => {
  it('should map enum values to PT-BR labels', () => {
    expect(userTipoLabel.buyer).toBe('Comprador');
    expect(userTipoLabel.provider).toBe('Prestador');
    expect(userTipoLabel.advertiser).toBe('Anunciante');
  });

  it('getUserTipoLabel should return mapped label or fallback', () => {
    expect(getUserTipoLabel('buyer')).toBe('Comprador');
    expect(getUserTipoLabel('provider')).toBe('Prestador');
    expect(getUserTipoLabel('advertiser')).toBe('Anunciante');
    expect(getUserTipoLabel(undefined)).toBe('-');
    expect(getUserTipoLabel(null as any)).toBe('-');
  });
});
