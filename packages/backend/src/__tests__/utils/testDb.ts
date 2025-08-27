import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectInMemoryMongo = async () => {
  if (mongoServer) return;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // Ensure models connect to this instance
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);
};

export const disconnectInMemoryMongo = async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.connection.close().catch(() => {});
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
