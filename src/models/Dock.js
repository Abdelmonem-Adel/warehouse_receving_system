import mongoose from 'mongoose';

const dockSchema = mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    status: { type: String, enum: ['available', 'busy'], default: 'available' },
    assignedStorekeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null }
}, { timestamps: true });

export default mongoose.model('Dock', dockSchema);
