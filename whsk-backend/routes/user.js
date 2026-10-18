require('dotenv').config();  // Add this at the very top
const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const { HSK_LEVEL } = require("../config/course");
const { response } = require("express");
const { Score } = require("../models/Score");
const router = express.Router();
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const multerFilter = (req, file, cb) => {
  console.log("Processing file:", file.mimetype);
  
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    console.log("Invalid file type:", file.mimetype);
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};
// console.log('Cloudinary Config:', {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      return file.mimetype.startsWith('audio') ? 'audio' : 'profile';
    },
    resource_type: (req, file) => {
      if (file.mimetype.startsWith('audio')) return 'raw';
      if (file.mimetype.startsWith('video')) return 'video';
      return 'auto';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'mp3', 'wav', 'mpeg'],
    public_id: (req, file) => {
      const fileName = file.originalname.split('.')[0];
      const fileExt = file.originalname.split('.').pop();
      return `${fileName}_${Date.now()}.${fileExt}`;
    },
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: multerFilter
});

const uploadUser = upload.single("file");

// Wrap the upload middleware in error handling
const handleUpload = (req, res, next) => {
  uploadUser(req, res, (err) => {
    if (err) {
      console.error("Upload Error:", err);
      return res.status(500).json({
        message: "Error uploading file",
        error: err.message
      });
    }
    next();
  });
};

const handleUploadUserPhoto = (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const filePath = req.file.path;

    res.send({
      message: "File uploaded successfully",
      fileName: req.file.originalname,
      filePath: filePath,
      format: req.file.format,
      resourceType: req.file.resource_type
    });
  } catch (error) {
    console.error("Handler Error:", error);
    res.status(500).json({
      message: "Error processing upload",
      error: error.message
    });
  }
};

// Update the route to use the error handling middleware
router.post("/uploadProfileImage", handleUpload, handleUploadUserPhoto);

router.get("/", async (req, res) => {
  const { withScores } = req.query;

  const docs = await User.find().lean();

  if (withScores) {
    const scores = await Score.find({ userID: { $in: docs.map(user => user._id) } }).lean();
    const grouped = new Map();
    scores.forEach(score => {
      const key = String(score.userID);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(score);
    });
    docs.forEach(user => { user.scores = grouped.get(String(user._id)) || []; });
  }

  res.send({ status: "success", docs });
});

router.post("/signup", (req, res) => {
  const newUser = req.body;

  bcrypt.hash(req.body.password, 4, (err, hash) => {
    if (!err) {
      User.create({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        hskLevel: HSK_LEVEL,
        role: 'normalUser',
        status: 'active'
      })
        .then((userRecord) => {
          const userData = createClientUser(userRecord);
          res.status(200).send({
            message: "Account Created",
            success: true,
            user: userData
          });
        })
        .catch((err) => {
          res.status(500).send({ 
            message: "Account Error", 
            success: false, 
            error: err.message 
          });
        });
    } else {
      res.status(500).send({ 
        message: "Unable to hash", 
        success: false, 
        error: err.message 
      });
    }
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return res.status(400).json({ auth: false, message: "Enter your username and password." });
  }
  if (User.db.readyState !== 1) {
    return res.status(503).json({ auth: false, message: "The database is reconnecting. Please try again shortly." });
  }
  try {
    const userRecord = await User.findOne({ username });
    if (!userRecord?.password || !await bcrypt.compare(password, userRecord.password)) {
      return res.status(401).json({ auth: false, message: "Username or password is incorrect." });
    }
    return res.json({ auth: true, user: createClientUser(userRecord) });
  } catch {
    return res.status(503).json({ auth: false, message: "The database is unavailable. Please try again shortly." });
  }
});
router.put("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  // console.log({ user });

  const updateOptions = ["username"];

  for (let index = 0; index < updateOptions.length; index++) {
    const element = updateOptions[index];
    user[element] = req.body[element] ? req.body[element] : user[element];
  }

  await user.save();
  res.send({ message: "user update successfully" });
});

router.get("/:id", async (req, res) => {
  try {
    const docs = await User.findOne({ _id: req.params.id });
    // console.log(docs);
    
    const { username, _id, email, hskLevel } = docs;

    res.send({
      username,
      _id,
      email,
      hskLevel,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({
      status: "fail",
      message: "something went wrong to get the user",
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await User.deleteOne({ _id: id });

  res.send({ status: "deleted successfully" });
});

const createClientUser = record => {
  const { password, _id, username, email, hskLevel, ...rest } = record.toObject ? record.toObject() : record;
  return {
    ...rest,
    timeStamp: Date.now(),
    id: _id.toString(),
    _id: _id.toString(),
    username,
    email,
    hskLevel,
    _doc: {
      ...rest,
      email,
      hskLevel,
      username,
      _id: _id.toString()
    },
  };
};

// PUT /api/user/:userId - Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body, hskLevel: HSK_LEVEL };

    console.log('PUT /user/:userId - Request received:', {
      userId,
      updateData
    });

    // First find the user to verify it exists
    const existingUser = await User.findById(userId);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the user fields
    Object.assign(existingUser, updateData);
    
    // Save the updated user
    await existingUser.save();

    // Convert to a plain object for response
    const userResponse = existingUser.toObject();

    console.log('User updated successfully:', userResponse);

    // Send back the complete updated user object
    return res.json({
      success: true,
      message: 'User update successfully',
      user: {
        ...userResponse,
        _id: userResponse._id.toString(),
        id: userResponse._id.toString()
      }
    });

  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating user profile'
    });
  }
});

module.exports = router;
