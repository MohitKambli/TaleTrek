const mongoose = require('mongoose');
const Counter = require('./Counter');

const storySchema = new mongoose.Schema({
  storyId: { type: Number, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: false },
  email: { type: String, required: false },
  likes: { type: Number, required: false },
  publishedDate: { type: Date, default: Date.now, required: false },
  images: [{ type: String }],
  comments: [{ type: String }]
});

// Pre-save hook to auto-increment storyId
storySchema.pre('save', async function(next) {
  // Check if the document is new
  if (this.isNew) {
    try {
      // Find and update the counter
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'storyId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      // Update the storyId only if it's a new document
      this.storyId = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
