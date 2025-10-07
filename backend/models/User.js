import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    smtpConfig: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: '' },
      password: { type: String, default: '', select: false },
    },
    warmupSettings: {
      isActive: { type: Boolean, default: false },
      currentVolume: { type: Number, default: 0 }, // Current daily send limit
      targetVolume: { type: Number, default: 100 }, // Target daily send limit
      dailyIncrease: { type: Number, default: 10 }, // Increase per day
      currentDay: { type: Number, default: 0 }, // Days into warmup
      startDate: { type: Date },
      lastIncrease: { type: Date },
      reputationScore: { type: Number, default: 50 }, // 0-100 reputation score
      alertsEnabled: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
