const mongoose = require('mongoose');

/**
 * Auction Schema
 * @private
 */
const ApprovalsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isApproved:{type:Boolean}
}, { timestamps: true }
);

/**
 * @typedef Auction
 */

module.exports = mongoose.model('Approvals', ApprovalsSchema);