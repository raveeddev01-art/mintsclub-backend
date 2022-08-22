const mongoose = require('mongoose')

/**
 * Settings Schema
 * @private
 */
const SettingsSchema = new mongoose.Schema(
    {
        username: { type: String },
        email: { type: String },
        bio: { type: String },
        profileImg: { type: String },
        profileBanner: { type: String },
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        royality: { type: String, default: '' },
        share: { type: String, default: '' },
        desc: { type: String, default: '' },
        domain: { type: String, default: '' },
        api: { type: String, default: '' },
    },
    { timestamps: true }
)

/**
 * @typedef Settings
 */

module.exports = mongoose.model('Settings', SettingsSchema)
