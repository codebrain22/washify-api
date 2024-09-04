const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    preferredName: {
      type: 'string',
      required: [true, 'Preferred name is required'],
      minlength: 3,
      trim: true,
    },
    email: {
      type: 'string',
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
      required: function () {
        return this.provider === 'local';
      },
      validate: [
        validator.isMobilePhone,
        'Please provide a valid phone number',
      ],
    },
    address: {
      type: 'string',
      required: function () {
        return this.provider === 'local';
      },
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    socialMediaHandles: [{ type: String, trim: true }],
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
      lowercase: true,
    },
    subscription: {
      type: String,
      enum: ['Basic', 'Premium', 'Advanced'],
    },
    password: {
      type: String,
      required: function () {
        return this.provider === 'local';
      },
      minLength: 4,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        return this.provider === 'local';
      },
      validate: {
        //This only works on CREATE/SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    socialLoginId: String,
    createdOn: { type: Date, default: Date.now() },
    active: { type: Boolean, default: true, selected: false },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    //Only for the administrators.
    peymentDetails: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentDetails',
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  //Only run if password was actually modified
  if (!this.isModified('password')) next();
  //Hash the password with the cost of 10
  this.password = await bcrypt.hash(this.password, 10);
  //Delete passwordConfirm field - Only neede for validation
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

userSchema.pre(/^find/, function (next) {
  // This points to the current query
  this.find({ active: {$ne: false} });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // e.g 100 < 200
  }

  //FALSE password was not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
