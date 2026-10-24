const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');

const Message = require('../models/Message');


router.post(
  '/',
  requireLogin,
  async (req, res) => {
    try {
      const { recipient, content } = req.body;

      const message = new Message({
        sender: req.user.id,
        recipient,
        content
      });

      await message.save();

      res.status(201).json({
        success: true,
        data: message
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);


router.get(
  '/:userId',
  requireLogin,
  async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          {
            sender: req.user.id,
            recipient: req.params.userId
          },
          {
            sender: req.params.userId,
            recipient: req.user.id
          }
        ]
      }).sort({ createdAt: 1 });

      res.json({
        success: true,
        data: messages
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);


module.exports = router;