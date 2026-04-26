import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memoryServer: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    let uri = process.env.MONGODB_URI;

    if (!uri) {
      // If no URI is provided, use an in-memory MongoDB instance
      console.warn('No MONGODB_URI found. Starting MongoMemoryServer...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!cached.memoryServer) {
          cached.memoryServer = await MongoMemoryServer.create();
        }
        uri = cached.memoryServer.getUri();
        console.log(`MongoMemoryServer started at ${uri}`);
      } catch (err) {
        throw new Error('Failed to start MongoMemoryServer. Please provide a MONGODB_URI or install mongodb-memory-server: ' + err.message);
      }
    }

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
