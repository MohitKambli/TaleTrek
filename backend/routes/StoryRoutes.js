// Import necessary modules
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const Story = require('../models/Story');
const User = require('../models/User');
const multer = require('multer');
const multerS3 = require('multer-s3');
const LikedStory = require('../models/LikedStory'); // Import the LikedStory model

// Configure AWS SDK with your credentials
const s3 = new AWS.S3({
  accessKeyId: 'AKIA6ODU2UVAROXT5ZEE',
  secretAccessKey: 'awCeuzylanCy2spJSCu4VPYkRr2pR8hh6HKRYZ9L',
});

// Configure multer to upload files directly to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'tale-trek-bucket',
    acl: 'public-read', // Set the files to be publicly readable
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname); // Set the file name in the S3 bucket
    }
  })
});

// Route to get all stories
router.get('/getAllStories', async (req, res) => {
  try {
    // Fetch all stories from the database
    const stories = await Story.find();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to add a new story with images uploaded to S3
router.post('/addStory', upload.array('images', 5), async (req, res) => {
  try {
    // Destructure story data from request body
    const { email, title, description, author, likes } = req.body;

    // Get the file URLs from the uploaded images
    const imageUrls = req.files.map(file => file.location);

    // Create a new story with image URLs
    const newStory = new Story({ email, title, description, author, likes, images: imageUrls });
    await newStory.save();

    res.status(201).json(newStory);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Route to get story details by ID
router.get('/story/:id', async (req, res) => {
  try {
    // Convert req.params.id to a number
    const storyId = parseInt(req.params.id, 10);

    // Check if the conversion was successful
    if (isNaN(storyId)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }

    // Find story by storyId in the database
    const story = await Story.findOne({ storyId: storyId });
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to like a story by ID
router.post('/like', async (req, res) => {
  try {
    const { email, storyId } = req.query; // Using req.query to access query parameters

    // Check if the conversion was successful
    if (isNaN(storyId)) {
      return res.status(400).json({ message: 'Invalid story ID' });
    }

    // Find story by storyId in the database
    const story = await Story.findOne({ storyId: parseInt(storyId, 10) });
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    // Increment the likes count of the story by 1
    story.likes += 1;
    // Save the updated story in the database
    await story.save();

    // Check if the user has already liked the story
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user.userId;

    // const likedStory = await LikedStory.findOne({ userId, storyId });
    // if (likedStory) {
    //   return res.status(400).json({ message: 'User has already liked this story' });
    // }

    // Create a new entry in the LikedStory collection for the user who liked the story
    const newLikedStory = new LikedStory({ userId, storyId: story.storyId });
    await newLikedStory.save();

    res.status(200).json({ message: 'Story liked successfully', likes: story.likes });
  } catch (error) {
    console.error('Error liking the story:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route to check if the user has liked a story by email and story ID
router.get('/checkLiked', async (req, res) => {
  try {
    // Retrieve email and storyId from query parameters
    const { email, storyId } = req.query;

    // Check if both email and storyId are provided
    if (!email || !storyId) {
      return res.status(400).json({ message: 'Email and storyId are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user.userId;

    // Check if the user with the specified email has liked the story with the specified ID
    const likedStory = await LikedStory.findOne({ userId, storyId });
    res.json({ liked: !!likedStory });
  } catch (error) {
    console.error('Error checking if user liked the story:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to delete a story by ID
router.delete('/deleteStory/:id', async (req, res) => {
  try {
    const storyId = parseInt(req.params.id, 10);

    // Find the story by ID
    const story = await Story.findOne({ storyId });

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Delete the story from MongoDB
    await Story.findOneAndDelete({ storyId });

    // Delete the images associated with the story from AWS S3
    if (story.images && story.images.length > 0) {
      const imageKeys = story.images.map(imageUrl => {
        const urlParts = imageUrl.split('/');
        return urlParts[urlParts.length - 1];
      });

      const params = {
        Bucket: 'tale-trek-bucket',
        Delete: {
          Objects: imageKeys.map(Key => ({ Key })),
          Quiet: false,
        },
      };

      await s3.deleteObjects(params).promise();
    }

    // Delete entries from the likedstories collection associated with the deleted story
    await LikedStory.deleteMany({ storyId });

    res.status(200).json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route to get comments for a story by ID
router.get('/comments/:id', async (req, res) => {
  try {
    const storyId = parseInt(req.params.id, 10);

    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.status(200).json({ comments: story.comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: error.message });
  }
});


// Route to add a comment to a story
router.post('/addComment/:id', async (req, res) => {
  try {
    const storyId = parseInt(req.params.id, 10);
    const { comment } = req.body;

    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    story.comments.push(comment);
    await story.save();

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
