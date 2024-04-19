// Import necessary modules
const mongoose = require('mongoose');

// Define the LikedStory schema
const likedStorySchema = new mongoose.Schema({
  userId: {
    type: Number,
    ref: 'User', // Assuming you have a User schema for user authentication
    required: true
  },
  storyId: {
    type: Number,
    ref: 'Story', // Assuming you have a Story schema for stories
    required: true
  }
});

// Create and export the LikedStory model
module.exports = mongoose.model('LikedStory', likedStorySchema);
