import mongoose from 'mongoose';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

interface FileMetadata {
    originalName: string;
    mimetype: string;
    size: number;
    uploadedBy?: string;
    categoria?: string;
    descricao?: string;
    uploadedAt: Date;
}

interface UploadResult {
    fileId: string;
    filename: string;
    metadata: FileMetadata;
}

export class UploadService {
    private getBucket(): mongoose.mongo.GridFSBucket {
        const db = getDatabase();
        return new mongoose.mongo.GridFSBucket(db, {
            bucketName: process.env.GRIDFS_BUCKET_NAME || 'super_app_uploads',
            chunkSizeBytes: parseInt(process.env.GRIDFS_CHUNK_SIZE || '261120')
        });
    }

    /**
     * Upload de arquivo para GridFS
     */
    async uploadToGridFS(
        buffer: Buffer,
        filename: string,
        metadata: FileMetadata
    ): Promise<UploadResult> {
        try {
            const bucket = this.getBucket();

            // Gerar nome único para o arquivo
            const uniqueFilename = `${Date.now()}_${filename}`;

            // Criar stream de upload
            const uploadStream = bucket.openUploadStream(uniqueFilename, {
                metadata
            });

            // Promise para aguardar o upload
            const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
                uploadStream.on('finish', () => {
                    logger.info('Arquivo enviado para GridFS', {
                        fileId: uploadStream.id.toString(),
                        filename: uniqueFilename,
                        size: metadata.size
                    });

                    resolve({
                        fileId: uploadStream.id.toString(),
                        filename: uniqueFilename,
                        metadata
                    });
                });

                uploadStream.on('error', (error) => {
                    logger.error('Erro no upload para GridFS', { error, filename });
                    reject(error);
                });
            });

            // Escrever buffer no stream
            uploadStream.end(buffer);

            return await uploadPromise;

        } catch (error) {
            logger.error('Erro no serviço de upload', { error, filename });
            throw error;
        }
    }

    /**
     * Obter informações do arquivo
     */
    async getFileInfo(fileId: string) {
        try {
            const bucket = this.getBucket();
            const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

            return files.length > 0 ? files[0] : null;

        } catch (error) {
            logger.error('Erro ao obter informações do arquivo', { error, fileId });
            throw error;
        }
    }

    /**
     * Listar arquivos do usuário
     */
    async getUserFiles(userId: string, page = 1, limit = 10) {
        try {
            const bucket = this.getBucket();
            const skip = (page - 1) * limit;

            const files = await bucket
                .find({ 'metadata.uploadedBy': userId })
                .sort({ uploadDate: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await bucket.find({ 'metadata.uploadedBy': userId }).count();

            return {
                files: files.map(file => ({
                    fileId: file._id.toString(),
                    filename: file.filename,
                    mimetype: file.metadata?.mimetype,
                    size: file.length,
                    uploadedAt: file.uploadDate,
                    url: `/api/upload/file/${file._id}`
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logger.error('Erro ao listar arquivos do usuário', { error, userId });
            throw error;
        }
    }

    /**
     * Deletar arquivo do GridFS
     */
    async deleteFile(fileId: string, userId?: string): Promise<boolean> {
        try {
            const bucket = this.getBucket();

            // Verificar se o arquivo existe e se o usuário tem permissão
            if (userId) {
                const file = await this.getFileInfo(fileId);
                if (!file || file.metadata?.uploadedBy !== userId) {
                    return false;
                }
            }

            await bucket.delete(new mongoose.Types.ObjectId(fileId));

            logger.info('Arquivo deletado do GridFS', { fileId, userId });
            return true;

        } catch (error) {
            logger.error('Erro ao deletar arquivo', { error, fileId, userId });
            return false;
        }
    }

    /**
     * Gerar URL pública para arquivo
     */
    generateFileUrl(fileId: string): string {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        return `${baseUrl}/api/upload/file/${fileId}`;
    }

    /**
     * Validar tipo de arquivo
     */
    isValidFileType(mimetype: string): boolean {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime'
        ];

        return allowedTypes.includes(mimetype);
    }

    /**
     * Validar tamanho do arquivo
     */
    isValidFileSize(size: number): boolean {
        const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
        return size <= maxSize;
    }

    /**
     * Upload múltiplo com validação
     */
    async uploadMultipleFiles(
        files: { buffer: Buffer; originalname: string; mimetype: string; size: number }[],
        userId: string,
        categoria?: string,
        descricao?: string
    ): Promise<UploadResult[]> {
        try {
            // Validar arquivos
            for (const file of files) {
                if (!this.isValidFileType(file.mimetype)) {
                    throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
                }
                if (!this.isValidFileSize(file.size)) {
                    throw new Error(`Arquivo muito grande: ${file.originalname}`);
                }
            }

            // Upload de todos os arquivos
            const uploadPromises = files.map(file => {
                const metadata: FileMetadata = {
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadedBy: userId,
                    categoria,
                    descricao,
                    uploadedAt: new Date()
                };

                return this.uploadToGridFS(file.buffer, file.originalname, metadata);
            });

            const results = await Promise.all(uploadPromises);

            logger.info('Upload múltiplo realizado', {
                userId,
                filesCount: files.length,
                fileIds: results.map(r => r.fileId)
            });

            return results;

        } catch (error) {
            logger.error('Erro no upload múltiplo', { error, userId });
            throw error;
        }
    }
}

export const uploadService = new UploadService();