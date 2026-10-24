const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['ASSIGNMENT', 'GRADE', 'ANNOUNCEMENT', 'QUIZ', 'EXAM', 'SYSTEM'], 
    default: 'SYSTEM' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  link: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);