import mongoose from 'mongoose';

const receiptsSchema = mongoose.Schema({
      keeperName: { type: String, required: true },
      keeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      companyName: { type: String, required: true },
      dockNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'Dock', required: true },
      poNumber: { type: String, required: true },
      totalItems: { type: Number, default: 0 },
      cartonNumber: { type: String, default: 0 },
      truckNumber: { type: String, default: 0 },
      skuNumber: { type: String, default: 0 },
      palletNumber: { type: String, default: 0 },
      comment: { type: String, default: '' },
      truckType: { type: String, enum: ['Dabaaba', 'Jumbo', 'Trailer'] },
      category: { type: String, enum: ['Non Food', 'Food', 'Water', 'Frozen', 'Bags', 'Beauty', 'Other'] },
      status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
      createdAt: { type: Date, default: Date.now },
      startedAt: { type: Date },
      endedAt: { type: Date },
      durationMinutes: { type: Number }

})

export default mongoose.model('Receipt', receiptsSchema);