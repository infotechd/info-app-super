import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rate limiting específico para upload
const uploadRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10, // 10 uploads por 15 minutos
    message: {
        success: false,
        message: 'Muitos uploads. Tente novamente em alguns minutos.'
    }
});

/**
 * @route   POST /api/upload/files
 * @desc    Upload múltiplo de arquivos para GridFS
 * @access  Private
 * @body    files: File[], categoria?: string, descricao?: string
 */
router.post('/files',
    uploadRateLimit,
    uploadController.uploadMultiple,
    uploadController.uploadFiles
);

/**
 * @route   GET /api/upload/file/:fileId
 * @desc    Download de arquivo do GridFS
 * @access  Public (para visualização de imagens/vídeos)
 * @params  fileId: string
 */
router.get('/file/:fileId', uploadController.downloadFile);

/**
 * @route   GET /api/upload/my-files
 * @desc    Listar arquivos do usuário logado
 * @access  Private
 * @query   page?: number, limit?: number
 */
router.get('/my-files', uploadController.getUserFiles);

/**
 * @route   GET /api/upload/info/:fileId
 * @desc    Obter informações detalhadas do arquivo
 * @access  Private
 * @params  fileId: string
 */
router.get('/info/:fileId', uploadController.getFileInfo);

/**
 * @route   DELETE /api/upload/file/:fileId
 * @desc    Deletar arquivo do GridFS
 * @access  Private
 * @params  fileId: string
 */
router.delete('/file/:fileId', uploadController.deleteFile);

/**
 * @route   POST /api/upload/image
 * @desc    Upload específico para imagens (compatibilidade)
 * @access  Private
 * @body    files: File[]
 */
router.post('/image',
    uploadRateLimit,
    uploadController.uploadMultiple,
    uploadController.uploadFiles
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload específico para vídeos (compatibilidade)
 * @access  Private
 * @body    files: File[]
 */
router.post('/video',
    uploadRateLimit,
    uploadController.uploadMultiple,
    uploadController.uploadFiles
);

export default router;