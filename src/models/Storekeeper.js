import mongoose from 'mongoose';

const storekeeperSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Storing plain text for MVP simplicity as requested, but standard is bcrypt
    status: { type: String, enum: ['available', 'busy'], default: 'available' },
    lastTurnAt: { type: Date, default: new Date(0) }, // Initialize to old date
}, { timestamps: true });

export default mongoose.model('Storekeeper', storekeeperSchema);
