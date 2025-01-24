import dotenv from 'dotenv';
dotenv.config();

import { connectToMongo } from './config/db.js';
import Question from './models/Question.js';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    await connectToMongo();

    // Load proto file
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

    // Implement the gRPC service
    const questionsServiceImpl = {
        // call.request => { query, pageNumber, pageSize, questionType }
        SearchQuestions: async (call, callback) => {
            try {
                const { query, pageNumber, pageSize, questionType } = call.request;
                const page = pageNumber || 1;
                const limit = pageSize || 10;
                const skip = (page - 1) * limit;

                // Build a Mongo query
                const filter = {};
                if (query) {
                    // simple partial match on title
                    // For big data, consider text index: { $text: { $search: query } }
                    filter.title = { $regex: query, $options: 'i' };
                }
                if (questionType) {
                    filter.type = questionType;
                }

                const totalCount = await Question.countDocuments(filter);
                const totalPages = Math.ceil(totalCount / limit);

                const results = await Question.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .lean();

                // Map each question to the proto format
                const questions = results.map((q) => ({
                    id: q._id.toString(),
                    type: q.type,
                    title: q.title
                }));

                callback(null, {
                    questions,
                    totalCount,
                    totalPages
                });
            } catch (error) {
                console.error('SearchQuestions error:', error);
                callback(error, null);
            }
        }
    };

    // Create gRPC server
    const server = new grpc.Server();
    server.addService(questsearch.QuestionsService.service, questionsServiceImpl);

    // Bind & start
    const port = process.env.GRPC_PORT || '50051';
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
        if (err) {
            console.error('Failed to bind gRPC server:', err);
            return;
        }
        console.log(`gRPC server is running on port ${boundPort}`);
        server.start();
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
