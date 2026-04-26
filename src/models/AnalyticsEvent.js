import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
  experience_id: { type: String, required: true },
  event_type: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
