const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Employee full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Retail Operations',
    },
    employmentDate: {
      type: Date,
      default: Date.now,
    },
    salaryType: {
      type: String,
      enum: ['MONTHLY', 'DAILY', 'HOURLY'],
      default: 'MONTHLY',
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    employmentStatus: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED'],
      default: 'ACTIVE',
    },
    bankAccountDetails: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Employee', employeeSchema);

