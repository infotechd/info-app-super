import { z } from 'zod';
import { createOfertaSchema, updateOfertaSchema } from '../../validation/ofertaValidation';

describe('ofertaValidation - mídias combinadas (imagens + vídeos) ≤ 3', () => {
  const baseCreate = {
    titulo: 'Serviço X',
    descricao: 'Descrição detalhada do serviço X com mais de 10 caracteres',
    preco: 100,
    categoria: 'Tecnologia' as const,
    localizacao: { cidade: 'São Paulo', estado: 'SP' },
  };

  it('create - deve aceitar quando total ≤ 3', () => {
    expect(() =>
      createOfertaSchema.parse({
        body: {
          ...baseCreate,
          imagens: ['/api/upload/file/abc1', '/api/upload/file/abc2'],
          videos: ['/api/upload/file/vid1'],
        },
      })
    ).not.toThrow();
  });

  it('create - deve falhar quando total > 3', () => {
    try {
      createOfertaSchema.parse({
        body: {
          ...baseCreate,
          imagens: ['/api/upload/file/a1', '/api/upload/file/a2', '/api/upload/file/a3'],
          videos: ['/api/upload/file/v1'],
        },
      });
      throw new Error('Esperava erro de validação');
    } catch (err: any) {
      expect(err).toBeInstanceOf(z.ZodError);
      const issues = (err as z.ZodError).issues.map(i => i.message);
      expect(issues.some(m => m.includes('Máximo de 3 mídias'))).toBeTruthy();
    }
  });

  it('update - deve aceitar total ≤ 3', () => {
    expect(() =>
      updateOfertaSchema.parse({
        params: { id: '123' },
        body: {
          imagens: ['/api/upload/file/a1'],
          videos: ['/api/upload/file/v1', '/api/upload/file/v2'],
        },
      })
    ).not.toThrow();
  });

  it('update - deve falhar quando total > 3', () => {
    try {
      updateOfertaSchema.parse({
        params: { id: '123' },
        body: {
          imagens: ['/api/upload/file/a1', '/api/upload/file/a2'],
          videos: ['/api/upload/file/v1', '/api/upload/file/v2'],
        },
      });
      throw new Error('Esperava erro de validação');
    } catch (err: any) {
      expect(err).toBeInstanceOf(z.ZodError);
      const issues = (err as z.ZodError).issues.map(i => i.message);
      expect(issues.some(m => m.includes('Máximo de 3 mídias'))).toBeTruthy();
    }
  });
});
