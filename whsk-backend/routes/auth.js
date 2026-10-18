const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models/User');
const { HSK_LEVEL } = require('../config/course');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", async (req, res) => {
  
  try {
    const { credential, hskLevel, checkOnly } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    console.log('Verifying Google token...');
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    }).catch(error => {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    });
    
    const { email, name, sub: googleId } = ticket.getPayload();
    console.log('Google token verified for email:', email);

    // Check if user exists
    let user = await User.findOne({ email }).catch(error => {
      console.error('Database query failed:', error);
      throw new Error('Database error');
    });
    
    // If checkOnly flag is true, we're just checking if user exists with HSK level
    if (checkOnly) {
      if (user && user.hskLevel) {
        return res.json({
          user: {
            timeStamp: Date.now(),
            id: user._id.toString(),
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            hskLevel: user.hskLevel,
            role: user.role,
            status: user.status,
            googleId: user.googleId,
            _doc: {
              ...user.toObject(),
              _id: user._id.toString()
            }
          }
        });
      } else {
        return res.status(400).json({ 
          needsHSKLevel: true,
          message: 'User needs to select HSK level'
        });
      }
    }

    if (!hskLevel) {
      return res.status(400).json({ error: 'Missing HSK level' });
    }

    if (!user) {
      console.log('Creating new user for:', email);
      user = new User({
        username: email.split('@')[0],
        email,
        googleId,
        hskLevel: HSK_LEVEL,
        status: 'active',
        role: 'normalUser'
      });
    } else {
      console.log('Updating existing user:', email);
      // Update existing user's HSK level and ensure googleId is set
      user.hskLevel = HSK_LEVEL;
      user.googleId = googleId;
      
      // If username is still email-based, you might want to update it with Google name
      if (user.username === email.split('@')[0] && name) {
        user.username = name;
      }
    }

    // Save user changes
    await user.save();

    // Create the response object
    const userResponse = {
      timeStamp: Date.now(),
      id: user._id.toString(),
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      hskLevel: user.hskLevel,
      role: user.role,
      status: user.status,
      googleId: user.googleId,
      _doc: {
        ...user.toObject(),
        _id: user._id.toString()
      }
    };

    console.log('Sending successful response:', userResponse);
    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
}); 

// Add a new route specifically for updating HSK level for Google users
router.put("/google-user/hsk-level", async (req, res) => {
  try {
    const { credential, hskLevel, userId } = req.body;

    if (!credential || !hskLevel || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email } = ticket.getPayload();

    // Find and update user
    const user = await User.findOne({ _id: userId, email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update HSK level
    user.hskLevel = HSK_LEVEL;
    await user.save();

    res.json({
      success: true,
      message: 'HSK level updated successfully',
      user: {
        timeStamp: Date.now(),
        id: user._id.toString(),
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        hskLevel: user.hskLevel,
        role: user.role,
        status: user.status,
        googleId: user.googleId,
        _doc: {
          ...user.toObject(),
          _id: user._id.toString()
        }
      }
    });

  } catch (error) {
    console.error('Google user update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating HSK level'
    });
  }
});

module.exports = router;
