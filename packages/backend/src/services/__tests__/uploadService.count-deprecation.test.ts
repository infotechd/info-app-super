import fs from 'fs';
import path from 'path';

/**
 * Este teste garante que não estamos mais usando o símbolo deprecated Cursor.count()
 * no serviço de upload. Isso valida a correção aplicada para o aviso de depreciação.
 */
describe('UploadService - deprecated API usage', () => {
  it('should not use deprecated Cursor.count() in uploadService.ts', () => {
    const filePath = path.join(__dirname, '..', 'uploadService.ts');
    const source = fs.readFileSync(filePath, 'utf8');

    // Assegura que não há chamadas a .count()
    expect(source).not.toMatch(/\.count\(\)/);
  });
});
