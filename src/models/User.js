import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'supervisor', 'gate', 'storekeeper'], required: true },
    
    // Storekeeper specific fields
    status: { type: String, enum: ['available', 'busy', 'break'], default: 'available' },
    onBreak: { type: Boolean, default: false },
    lastTurnAt: { type: Date, default: new Date(0) },
    priorityIndex: { type: Number, default: 999 } // Low priority default
}, { timestamps: true });

export default mongoose.model('User', userSchema);
