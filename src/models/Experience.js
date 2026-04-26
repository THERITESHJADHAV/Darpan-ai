import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
  id: String,
  type: String,
  content: mongoose.Schema.Types.Mixed,
  order: Number
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, required: true, default: 'story' },
  status: { type: String, required: true, default: 'draft' },
  content: String,
  blocks: [BlockSchema],
  thumbnail: String,
  tags: [String],
  views: { type: Number, default: 0 },
  engagement_rate: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.Experience || mongoose.model('Experience', ExperienceSchema);
