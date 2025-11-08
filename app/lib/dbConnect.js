import mongoose from 'mongoose';
import { Log } from './models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ashikurovi2003_db_user:Qoo8mvf6If5FDnLY@smartstock.g70e1oq.mongodb.net/smartstock?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env');
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null, indexesSynced: false };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;

  if (!cached.indexesSynced) {
    try {
      await Log.syncIndexes();
      cached.indexesSynced = true;
    } catch (err) {
      // Swallow to avoid blocking requests; TTL will remain as currently defined in DB
    }
  }

  return cached.conn;
}