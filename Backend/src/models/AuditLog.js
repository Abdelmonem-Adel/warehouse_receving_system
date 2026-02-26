import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema({
    supervisorName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "MANUAL_ASSIGN"
    details: { type: String, required: true }, // "Assigned Company X to Dock Y and SK Z"
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);
