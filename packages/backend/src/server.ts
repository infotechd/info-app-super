import http from 'http';
import app from './app';
import config from './config';
import connectDB from './config/database';
import { logger } from './utils/logger';

const PORT = config.PORT;

async function start() {
  try {
    // Conecta ao MongoDB (ou pula se SKIP_DB=true)
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Super App backend iniciado em http://localhost:${PORT}`);
    });

    // Tratamento de erros do servidor
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Porta ${PORT} já está em uso.`);
      } else {
        logger.error('Erro no servidor HTTP', { message: err.message, stack: err.stack });
      }
      process.exit(1);
    });

    // Encerramento gracioso
    const shutdown = (signal: string) => {
      return () => {
        logger.info(`Recebido ${signal}. Encerrando servidor...`);
        server.close(() => {
          logger.info('Servidor encerrado.');
          process.exit(0);
        });
        // Força encerramento após timeout
        setTimeout(() => process.exit(1), 10000).unref();
      };
    };

    process.on('SIGINT', shutdown('SIGINT'));
    process.on('SIGTERM', shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error: any) => {
      logger.error('Uncaught Exception', { message: error?.message, stack: error?.stack });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('Falha ao iniciar o servidor', { message: error?.message, stack: error?.stack });
    process.exit(1);
  }
}

start();
