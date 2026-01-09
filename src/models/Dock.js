import mongoose from 'mongoose';

const dockSchema = mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    status: { type: String, enum: ['available', 'busy'], default: 'available' },
    currentShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null }
}, { timestamps: true });

export default mongoose.model('Dock', dockSchema);
