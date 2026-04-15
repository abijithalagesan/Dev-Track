const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        try {
            const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return false;
        } catch (initialErr) {
            console.log(`Local MongoDB not found. Falling back to In-Memory MongoDB...`);

            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();

            const conn = await mongoose.connect(uri);
            console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
            return true;
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
