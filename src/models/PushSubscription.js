import mongoose from 'mongoose';

const pushSubscriptionSchema = mongoose.Schema({
    storekeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    }
}, { timestamps: true });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
