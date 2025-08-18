import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { RegisterInput, LoginInput } from '../validation/authValidation';

interface AuthenticatedRequest extends AuthRequest {
    body: RegisterInput | LoginInput;
}

// Mapeia o tipo do usuário do modelo (pt) para o padrão da API (en)
const mapTipoToApi = (tipo: any): 'buyer' | 'provider' | 'advertiser' => {
    switch (tipo) {
        case 'comprador':
        case 'buyer':
            return 'buyer';
        case 'prestador':
        case 'provider':
            return 'provider';
        case 'anunciante':
        case 'advertiser':
            return 'advertiser';
        default:
            return 'buyer';
    }
};

// Registrar usuario
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { nome, email, senha, telefone, tipo } = req.body as RegisterInput;

        // Verificar se utilizador já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
            return;
        }

        // Criar usuario
        const user = new User({
            nome,
            email,
            senha,
            telefone,
            tipo
        });

        await user.save();

        // Gerar token
        const token = jwt.sign(
            { userId: user._id },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        logger.info('Usuário registrado:', { userId: user._id, email });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: {
                token,
                user: {
                    id: user._id,
                    nome: user.nome,
                    email: user.email,
                    tipo: mapTipoToApi(user.tipo),
                    telefone: user.telefone
                }
            }
        });
    } catch (error) {
        logger.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Login
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { email, senha } = req.body as LoginInput;

        // Buscar utilizador com senha
        const user = await User.findOne({ email }).select('+senha');
        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Credenciais inválidas'
            });
            return;
        }

        // Verificar se conta está ativa
        if (!user.ativo) {
            res.status(400).json({
                success: false,
                message: 'Conta desativada'
            });
            return;
        }

        // Verificar senha
        const isMatch = await user.comparePassword(senha);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: 'Credenciais inválidas'
            });
            return;
        }

        // Gerar token
        const token = jwt.sign(
            { userId: user._id },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        logger.info('Login realizado:', { userId: user._id, email });

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: {
                    id: user._id,
                    nome: user.nome,
                    email: user.email,
                    tipo: mapTipoToApi(user.tipo),
                    telefone: user.telefone
                }
            }
        });
    } catch (error) {
        logger.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Perfil do usuario
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const authUser = req.user;
        if (!authUser?.id) {
            res.status(401).json({
                success: false,
                message: 'Não autenticado'
            });
            return;
        }

        const user = await User.findById(authUser.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Perfil recuperado com sucesso',
            data: {
                user: {
                    id: user._id,
                    nome: user.nome,
                    email: user.email,
                    telefone: user.telefone,
                    tipo: mapTipoToApi(user.tipo),
                    ativo: user.ativo,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};