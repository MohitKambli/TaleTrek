const mongoose = require('mongoose');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Pre-save hook to auto-increment userId
userSchema.pre('save', function(next) {
  const doc = this;
  Counter.findByIdAndUpdate(
    { _id: 'userId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).then(counter => {
    doc.userId = counter.seq;
    next();
  }).catch(err => {
    next(err);
  });
});

const User = mongoose.model('User', userSchema);

module.exports = User;
