import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
import authRoutes from './authRoutes';
import uploadRoutes from './uploadRoutes';
import { generalLimiter } from '../middleware/rateLimiter';

const router: ExpressRouter = Router();

// Rate limiting geral
router.use(generalLimiter);

// Rotas da API
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);

// Rota de health check (formato ApiResponse)
router.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Super App API funcionando!',
        data: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        }
    });
});

export default router;