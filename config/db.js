const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        try {
            const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return false;
        } catch (initialErr) {
            if (!uri) {
                console.error('MONGODB_URI is not defined in environment variables.');
            }
            if (process.env.VERCEL) {
                console.error('MongoDB URI not provided or unreachable on Vercel. In-memory fallback is disabled in serverless environments.');
                return false;
            }

            console.log(`Local MongoDB not found. Falling back to In-Memory MongoDB...`);

            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();

            const conn = await mongoose.connect(uri);
            console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
            return true;
        }
    } catch (error) {
        console.error(`Error in connectDB: ${error.message}`);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
