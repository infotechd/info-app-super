import { uploadController } from '../../controllers/uploadController';
import { uploadService } from '../../services/uploadService';
import type { Request, Response, NextFunction } from 'express';

jest.mock('../../services/uploadService', () => ({
  __esModule: true,
  uploadService: {
    getFileInfo: jest.fn(),
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

describe('uploadController.getFileInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 400 para fileId inválido', async () => {
    const req = { params: { fileId: 'invalido' } } as unknown as Request;
    const res = createRes();

    await uploadController.getFileInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'ID de arquivo inválido' });
  });

  it('deve retornar 404 quando arquivo não encontrado', async () => {
    const validId = '507f1f77bcf86cd799439011'; // 24 hex
    (uploadService.getFileInfo as jest.Mock).mockResolvedValue(null);

    const req = { params: { fileId: validId } } as unknown as Request;
    const res = createRes();

    await uploadController.getFileInfo(req, res, next);

    expect(uploadService.getFileInfo).toHaveBeenCalledWith(validId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Arquivo não encontrado' });
  });

  it('deve retornar 200 com dados do arquivo quando encontrado', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const fileInfo = {
      _id: validId,
      filename: 'foto.jpg',
      length: 1234,
      uploadDate: new Date('2025-01-01T00:00:00.000Z'),
      metadata: { mimetype: 'image/jpeg', any: 'x' },
    };
    (uploadService.getFileInfo as jest.Mock).mockResolvedValue(fileInfo);

    const req = { params: { fileId: validId } } as unknown as Request;
    const res = createRes();

    await uploadController.getFileInfo(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        fileId: fileInfo._id,
        filename: fileInfo.filename,
        mimetype: fileInfo.metadata?.mimetype,
        size: fileInfo.length,
        uploadedAt: fileInfo.uploadDate,
        metadata: fileInfo.metadata,
      },
    });
  });
});
