import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: '' }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, value) {
    delete value.password;
    delete value.__v;
    return value;
  }
});

export default mongoose.model('User', userSchema);
