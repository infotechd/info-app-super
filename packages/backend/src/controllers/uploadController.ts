import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer, { FileFilterCallback } from 'multer';
import mongoose from 'mongoose';
const { GridFSBucket } = mongoose.mongo;
const { ObjectId } = mongoose.Types;
import { getDatabase } from '../config/database';
import { uploadService } from '../services/uploadService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';

// Configuração do multer para upload em memória
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
        files: parseInt(process.env.MAX_FILES_PER_UPLOAD || '5'),
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime'
        ]).map(t => t.trim());

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            // Rejeita o arquivo sem lançar erro para evitar crash no fluxo do multer
            cb(null, false);
        }
    },
});

// Schema de validação para upload
const uploadSchema = z.object({
    categoria: z.string().optional(),
    descricao: z.string().optional(),
});

type UploadController = {
    uploadMultiple: RequestHandler;
    uploadFiles: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    downloadFile: RequestHandler;
    getUserFiles: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    deleteFile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getFileInfo: RequestHandler;
};

export const uploadController: UploadController = {
    // Middleware para upload múltiplo
    uploadMultiple: upload.array('files', 5) as RequestHandler,

    // Upload de imagens/vídeos para GridFS
    async uploadFiles(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const filesInput = req.files;
            const files: Express.Multer.File[] = Array.isArray(filesInput)
                ? (filesInput as Express.Multer.File[])
                : filesInput
                    ? Object.values(filesInput as { [fieldname: string]: Express.Multer.File[] }).flat()
                    : [];

            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo foi enviado'
                });
                return;
            }

            // Validar dados adicionais
            const validatedData = uploadSchema.parse(req.body);

            // Fazer upload de cada arquivo para GridFS
            const uploadPromises = files.map(async (file) => {
                const metadata = {
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadedBy: req.user?.id,
                    categoria: validatedData.categoria,
                    descricao: validatedData.descricao,
                    uploadedAt: new Date(),
                };

                return await uploadService.uploadToGridFS(file.buffer, file.originalname, metadata);
            });

            const uploadResults = await Promise.all(uploadPromises);

            logger.info('Upload realizado com sucesso', {
                userId: req.user?.id,
                filesCount: files.length,
                fileIds: uploadResults.map(r => r.fileId)
            });

            res.status(201).json({
                success: true,
                message: 'Arquivos enviados com sucesso',
                data: {
                    files: uploadResults.map(result => ({
                        fileId: result.fileId,
                        filename: result.filename,
                        url: `/api/upload/file/${result.fileId}`,
                        mimetype: result.metadata.mimetype,
                        size: result.metadata.size
                    }))
                }
            });

        } catch (error) {
            logger.error('Erro no upload de arquivos', { error, userId: req.user?.id });
            next(error);
        }
    },

    // Download de arquivo do GridFS
    async downloadFile(req: Request, res: Response, next: NextFunction) {
        try {
            const { fileId } = req.params;

            if (!ObjectId.isValid(fileId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de arquivo inválido'
                });
                return;
            }

            const db = getDatabase();
            const bucket = new GridFSBucket(db, {
                bucketName: process.env.GRIDFS_BUCKET_NAME || 'super_app_uploads'
            });

            // Buscar informações do arquivo
            const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();

            if (files.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
                return;
            }

            const file = files[0];

            // Configurar headers para download
            res.set({
                'Content-Type': file.metadata?.mimetype || 'application/octet-stream',
                'Content-Length': file.length.toString(),
                'Content-Disposition': `inline; filename="${file.filename}"`,
                'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
            });

            // Stream do arquivo
            const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

            downloadStream.on('error', (error: any) => {
                logger.error('Erro no download do arquivo', { error: error?.message || String(error), fileId });
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Erro ao baixar arquivo'
                    });
                } else {
                    try { res.end(); } catch {}
                }
                try { downloadStream.destroy(); } catch {}
            });

            downloadStream.pipe(res);

        } catch (error) {
            logger.error('Erro no download de arquivo', { error, fileId: req.params.fileId });
            next(error);
        }
    },

    // Listar arquivos do usuário
    async getUserFiles(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Não autenticado'
                });
                return;
            }

            const files = await uploadService.getUserFiles(userId, page, limit);

            res.json({
                success: true,
                data: files
            });

        } catch (error) {
            logger.error('Erro ao listar arquivos do usuário', { error, userId: req.user?.id });
            next(error);
        }
    },

    // Deletar arquivo
    async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { fileId } = req.params;
            const userId = req.user?.id;

            if (!ObjectId.isValid(fileId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de arquivo inválido'
                });
                return;
            }

            const deleted = await uploadService.deleteFile(fileId, userId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado ou sem permissão'
                });
                return;
            }

            logger.info('Arquivo deletado com sucesso', { fileId, userId });

            res.json({
                success: true,
                message: 'Arquivo deletado com sucesso'
            });

        } catch (error) {
            logger.error('Erro ao deletar arquivo', { error, fileId: req.params.fileId, userId: req.user?.id });
            next(error);
        }
    },

    // Obter informações do arquivo
    async getFileInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { fileId } = req.params;

            if (!ObjectId.isValid(fileId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de arquivo inválido'
                });
            }

            const fileInfo = await uploadService.getFileInfo(fileId);

            if (!fileInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Arquivo não encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    fileId: fileInfo._id,
                    filename: fileInfo.filename,
                    mimetype: fileInfo.metadata?.mimetype,
                    size: fileInfo.length,
                    uploadedAt: fileInfo.uploadDate,
                    metadata: fileInfo.metadata
                }
            });

        } catch (error) {
            logger.error('Erro ao obter informações do arquivo', { error, fileId: req.params.fileId });
            next(error);
        }
    }
};