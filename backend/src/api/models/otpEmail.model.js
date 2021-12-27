const mongoose = require('mongoose');

/**
 * Settings Schema
 * @private
 */
const otpSchema = new mongoose.Schema({
    email: { type: String, default: '' },
    otpCode: { type: Number},

}, { timestamps: true }
);

/**
 * @typedef Settings
 */

module.exports = mongoose.model('Otp', otpSchema);