const mongoose = require('mongoose');

function generateVoucherId() {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${yyyymm}${random}`;
}

const FeeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    month: { type: String, required: true }, // e.g. "Oct 2026"
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Monthly', 'One-Time'], default: 'Monthly' },
    dueDate: { type: Date, required: true },
    voucherId: { type: String, required: true, unique: true, default: generateVoucherId },
    status: { type: String, enum: ['UNPAID', 'PENDING', 'PAID', 'REJECTED'], default: 'UNPAID' },
    proofUrl: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fee', FeeSchema);