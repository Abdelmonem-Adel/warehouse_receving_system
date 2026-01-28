import mongoose from 'mongoose';

const receiptsSchema = mongoose.Schema({
      keeperName: { type: String, required: true },
      companyName: { type: String, required: true },
      dockNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'Dock', required: true },
      poNumber: { type: String, required: true },
      totalItems: { type: Number, default: 0 },
      truckType: { type: String, enum: ['دبابة', 'جامبو', 'جرار'] },
      status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
      createdAt: { type: Date, default: Date.now },
      startedAt: { type: Date },
      endedAt: { type: Date },
      durationMinutes: { type: Number }
      
})

export default mongoose.model('Receipt', receiptsSchema);