import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isActive: { type: Boolean, default: true },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experience: { type: Number, min: 0, default: 0 },
    consultationFee: { type: Number, min: 0, required: true },
    about: { type: String, trim: true, maxlength: 1200, default: '' },
    availability: {
      days: { type: [Number], default: [1, 2, 3, 4, 5] },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      slotDuration: { type: Number, min: 15, max: 120, default: 30 }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
