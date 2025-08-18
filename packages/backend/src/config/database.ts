import mongoose from 'mongoose';
import config from '.';
import logger from '../utils/logger';

// Configurar Mongoose
mongoose.set('strictQuery', true);

const connectDB = async (): Promise<void> => {
    if (config.SKIP_DB) {
        logger.warn('SKIP_DB habilitado: iniciando servidor sem conexão ao MongoDB');
        return;
    }

    const uri = config.MONGO_URI;

    try {
        await mongoose.connect(uri, {
            // useNewUrlParser/useUnifiedTopology são default em mongoose >= 6
            // deixando objeto de opções vazio para compatibilidade
        } as any);

        const connection = mongoose.connection;

        connection.on('connected', () => {
            logger.info('Conectado ao MongoDB com sucesso');
        });

        connection.on('error', (err) => {
            logger.error('Erro na conexão com MongoDB:', err);
        });

        connection.on('disconnected', () => {
            logger.warn('Desconectado do MongoDB');
        });

    } catch (error) {
        logger.error('Falha ao conectar ao MongoDB:', error);
        // Em produção, falhar o boot; em dev, apenas warn
        if (config.IS_PROD) {
            throw error;
        }
    }
};

export const getDatabase = (): any => {
    // Retorna a instância atual do banco para uso com GridFSBucket
    return (mongoose.connection as any).db;
};

export default connectDB;
