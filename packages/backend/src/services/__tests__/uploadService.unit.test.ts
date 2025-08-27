import { uploadService } from '../../services/uploadService';

/**
 * Testes unitários focados em regras simples e estáveis (manutenibilidade)
 * - Tipos e tamanhos válidos
 * - Geração de URL
 * - Validações de uploadMultipleFiles (erros em entradas inválidas)
 */

describe('uploadService - validações básicas', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('isValidFileType deve aceitar tipos permitidos e rejeitar os demais', () => {
    // default permite jpeg, png, mp4
    expect(uploadService.isValidFileType('image/jpeg')).toBe(true);
    expect(uploadService.isValidFileType('image/png')).toBe(true);
    expect(uploadService.isValidFileType('video/mp4')).toBe(true);
    expect(uploadService.isValidFileType('application/pdf')).toBe(false);

    // com env personalizado
    process.env.ALLOWED_FILE_TYPES = 'image/webp, image/heic';
    expect(uploadService.isValidFileType('image/webp')).toBe(true);
    expect(uploadService.isValidFileType('image/png')).toBe(false);
  });

  it('isValidFileSize deve respeitar o limite padrão (10MB) e o configurado por env', () => {
    // 10MB padrão
    expect(uploadService.isValidFileSize(10 * 1024 * 1024)).toBe(true);
    expect(uploadService.isValidFileSize(10 * 1024 * 1024 + 1)).toBe(false);

    process.env.MAX_FILE_SIZE = String(1 * 1024 * 1024); // 1MB
    expect(uploadService.isValidFileSize(512 * 1024)).toBe(true);
    expect(uploadService.isValidFileSize(2 * 1024 * 1024)).toBe(false);
  });

  it('generateFileUrl deve usar API_BASE_URL quando definido, caso contrário localhost', () => {
    const fid = 'abc123';
    process.env.API_BASE_URL = 'http://api.local:3000';
    expect(uploadService.generateFileUrl(fid)).toBe(`http://api.local:3000/api/upload/file/${fid}`);

    delete process.env.API_BASE_URL;
    expect(uploadService.generateFileUrl(fid)).toBe(`http://localhost:3000/api/upload/file/${fid}`);
  });

  it('uploadMultipleFiles deve lançar erro para tipo inválido antes de tentar upload', async () => {
    const files = [
      { buffer: Buffer.from('x'), originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 },
    ];
    await expect(
      uploadService.uploadMultipleFiles(files as any, 'user1')
    ).rejects.toThrow(/Tipo de arquivo não permitido/i);
  });

  it('uploadMultipleFiles deve lançar erro para tamanho inválido antes de tentar upload', async () => {
    const files = [
      { buffer: Buffer.from('x'), originalname: 'big.jpg', mimetype: 'image/jpeg', size: 20 * 1024 * 1024 },
    ];
    await expect(
      uploadService.uploadMultipleFiles(files as any, 'user1')
    ).rejects.toThrow(/Arquivo muito grande/i);
  });
});
