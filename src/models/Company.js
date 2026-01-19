import mongoose from 'mongoose';

const companySchema = mongoose.Schema({
    companyName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceImage: { type: String }, // Optional
    status: { type: String, enum: ['waiting', 'receiving', 'finished'], default: 'waiting' },
    dock: { type: mongoose.Schema.Types.ObjectId, ref: 'Dock', default: null },
    assignedStorekeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
