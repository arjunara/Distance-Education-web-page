const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pleas enter name']
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: [true, 'email should be in lowercase']
    },
    phoneNumber: {
      type: String,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minLength: [6, 'password must be 6 char, got {VALUE}']
    },
    passwordResetToken: {
      type: String,
      required: false
    },
    resetTokenExpiry: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
);
//A mongoose model is a wrapper on the Mongoose schema
//A mongoose schema defines the structure of the document

const User = new mongoose.model('User', userSchema);

module.exports = User;
