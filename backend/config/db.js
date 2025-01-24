import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // loads .env

export async function connectToMongo() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing MONGODB_URI in environment');
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB!');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}
