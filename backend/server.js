const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
app.use('/users', require(path.join(__dirname, 'routes', 'userRoutes')));
app.use('/stories', require(path.join(__dirname, 'routes', 'storyRoutes')));
// Add more routes as needed

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
