import { uploadController } from '../../controllers/uploadController';
import { uploadService } from '../../services/uploadService';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';

jest.mock('../../services/uploadService', () => ({
  __esModule: true,
  uploadService: {
    getUserFiles: jest.fn(),
    deleteFile: jest.fn(),
  },
}));

const createRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json = jest.fn().mockReturnValue(res as Response);
  res.setHeader = jest.fn();
  return res as Response & { status: jest.Mock; json: jest.Mock };
};

const next: NextFunction = jest.fn();

describe('uploadController - getUserFiles e deleteFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getUserFiles deve retornar 401 quando não autenticado', async () => {
    const req = { user: undefined, query: {} } as unknown as AuthRequest;
    const res = createRes();

    await uploadController.getUserFiles(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Não autenticado' });
  });

  it('getUserFiles deve retornar lista quando autenticado', async () => {
    (uploadService.getUserFiles as jest.Mock).mockResolvedValue({ files: [], pagination: { page: 1 } });
    const req = { user: { id: 'u1' }, query: { page: '2', limit: '5' } } as unknown as AuthRequest;
    const res = createRes();

    await uploadController.getUserFiles(req, res, next);

    expect(uploadService.getUserFiles).toHaveBeenCalledWith('u1', 2, 5);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { files: [], pagination: { page: 1 } } });
  });

  it('deleteFile deve retornar 400 para ObjectId inválido', async () => {
    const req = { params: { fileId: 'x' }, user: { id: 'u1' } } as unknown as AuthRequest;
    const res = createRes();

    await uploadController.deleteFile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'ID de arquivo inválido' });
  });

  it('deleteFile deve retornar 404 quando deleteFile retorna false', async () => {
    (uploadService.deleteFile as jest.Mock).mockResolvedValue(false);
    const req = { params: { fileId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } } as unknown as AuthRequest;
    const res = createRes();

    await uploadController.deleteFile(req, res, next);

    expect(uploadService.deleteFile).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'u1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Arquivo não encontrado ou sem permissão' });
  });

  it('deleteFile deve retornar sucesso quando deleteFile retorna true', async () => {
    (uploadService.deleteFile as jest.Mock).mockResolvedValue(true);
    const req = { params: { fileId: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } } as unknown as AuthRequest;
    const res = createRes();

    await uploadController.deleteFile(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Arquivo deletado com sucesso' });
  });
});
