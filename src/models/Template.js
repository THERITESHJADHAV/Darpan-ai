import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, required: true },
  category: { type: String, required: true },
  thumbnail: String,
  blocks: [mongoose.Schema.Types.Mixed],
  preview_data: String,
  popularity: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);
