import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Never expose passwordHash in json serialization
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', UserSchema);
