import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToMongo } from '../config/db.js';
import Question from '../models/Question.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importData() {
    try {
        await connectToMongo();

        const filePath = path.join(__dirname, '..', 'speakx_questions.json');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));


        const transformedData = data.map(item => {
            const newItem = { ...item };
            if (newItem._id && newItem._id.$oid) {
                delete newItem._id;
            }
            if (newItem.siblingId && newItem.siblingId.$oid) {
                newItem.siblingId = newItem.siblingId.$oid;
            }
            return newItem;
        });

        await Question.insertMany(transformedData);
        console.log('Data imported successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

importData();
