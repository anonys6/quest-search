// scripts/importQuestions.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo } from '../config/db.js';
import Question from '../models/Question.js';

// For ES modules, __dirname trick:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importData() {
    try {
        // 1) Connect DB
        await connectToMongo();

        // 2) Read JSON file
        const filePath = path.join(__dirname, '..', 'speakx_questions.json');
        // or portion.json or whichever large file you have
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // 3) Clean up any existing data if you want a fresh start:
        // await Question.deleteMany({});

        // If your JSON has { "_id": { "$oid": "..." } }, you may want to transform or remove those fields
        const transformedData = data.map(item => {
            const newItem = { ...item };
            if (newItem._id && newItem._id.$oid) {
                delete newItem._id; // let Mongo auto-generate
            }
            if (newItem.siblingId && newItem.siblingId.$oid) {
                newItem.siblingId = newItem.siblingId.$oid;
            }
            return newItem;
        });

        // 4) Insert into collection
        await Question.insertMany(transformedData);
        console.log('Data imported successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

importData();
