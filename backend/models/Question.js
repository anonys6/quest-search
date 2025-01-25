import mongoose from 'mongoose';

const { Schema } = mongoose;

const BlockSchema = new Schema({
    text: String,
    showInOption: Boolean,
    isAnswer: Boolean
}, { _id: false });

const OptionSchema = new Schema({
    text: String,
    isCorrectAnswer: Boolean
}, { _id: false });

const QuestionSchema = new Schema({
    type: {
        type: String,
        enum: ['ANAGRAM', 'MCQ', 'READ_ALONG', 'CONTENT_ONLY', 'CONVERSATION'],
        required: true
    },
    anagramType: {
        type: String,
        enum: ['WORD', 'SENTENCE'],
        required: false
    },
    blocks: [BlockSchema],
    options: [OptionSchema],
    solution: { type: String },
    title: { type: String, required: true },
    siblingId: { type: Schema.Types.ObjectId }, 
}, { timestamps: true });

QuestionSchema.index({ title: 'text' });

export default mongoose.model('Question', QuestionSchema);
