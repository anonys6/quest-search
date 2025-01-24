// server.js (modified)
import dotenv from 'dotenv';
dotenv.config();

import { connectToMongo } from './config/db.js';
import Question from './models/Question.js';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    await connectToMongo();

    // 1) Setup gRPC definitions (like before)
    const PROTO_PATH = path.join(__dirname, 'proto', 'questions.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const questsearch = protoDescriptor.questsearch;

    // 2) Implementation
    const questionsServiceImpl = {
        SearchQuestions: async (call, callback) => {
            try {
                const { query, pageNumber, pageSize, questionType } = call.request;
                const page = pageNumber || 1;
                const limit = pageSize || 10;
                const skip = (page - 1) * limit;

                // Build a Mongo query
                const filter = {};
                if (query) {
                    filter.title = { $regex: query, $options: 'i' };
                }
                if (questionType) {
                    filter.type = questionType;
                }

                const totalCount = await Question.countDocuments(filter);
                const totalPages = Math.ceil(totalCount / limit);

                const results = await Question.find(filter).skip(skip).limit(limit).lean();

                const questions = results.map((q) => ({
                    id: q._id.toString(),
                    type: q.type,
                    title: q.title
                }));

                callback(null, { questions, totalCount, totalPages });
            } catch (error) {
                console.error('SearchQuestions error:', error);
                callback(error, null);
            }
        }
    };

    // 3) Create gRPC server
    const grpcServer = new grpc.Server();
    grpcServer.addService(questsearch.QuestionsService.service, questionsServiceImpl);

    // 4) Instead of automatically starting gRPC on 50051,
    // we embed the gRPC server as an "insecure" server on a random port
    // or we can keep it local only.
    const GRPC_PORT = process.env.GRPC_PORT || '50052';
    grpcServer.bindAsync(
        `0.0.0.0:${GRPC_PORT}`,
        grpc.ServerCredentials.createInsecure(),
        (err, boundPort) => {
            if (err) {
                console.error('Failed to bind gRPC server:', err);
                return;
            }
            console.log(`gRPC server is running on port ${boundPort}`);
            grpcServer.start();
        }
    );

    // 5) Setup an Express HTTP server to handle REST
    const app = express();
    const PORT = process.env.PORT || 4000; // Render expects you to listen on process.env.PORT

    app.get('/search', async (req, res) => {
        try {
            // We call the gRPC method internally
            // But we can also just do the same logic directly here
            const query = req.query.query || '';
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const questionType = req.query.type || '';

            // Re-use the same logic:
            const filter = {};
            if (query) {
                filter.title = { $regex: query, $options: 'i' };
            }
            if (questionType) {
                filter.type = questionType;
            }

            const skip = (page - 1) * pageSize;
            const totalCount = await Question.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / pageSize);
            const results = await Question.find(filter).skip(skip).limit(pageSize).lean();

            const questions = results.map((q) => ({
                id: q._id.toString(),
                type: q.type,
                title: q.title
            }));

            return res.json({ questions, totalCount, totalPages });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/', (req, res) => {
        res.send('Node + gRPC + Express Server is running!');
    });

    app.listen(PORT, () => {
        console.log(`Express server listening on port ${PORT}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
