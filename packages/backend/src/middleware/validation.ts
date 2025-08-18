import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                logger.warn('Erro de validação:', { errors, body: req.body });

                res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors
                });
            } else {
                next(error);
            }
        }
    };
};
