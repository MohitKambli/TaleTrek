const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutesPath = require('./routes/UserRoutes');
const storyRoutesPath = require('./routes/StoryRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8010;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define routes
app.use('/users', userRoutesPath);
app.use('/stories', storyRoutesPath);
// Add more routes as needed

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
