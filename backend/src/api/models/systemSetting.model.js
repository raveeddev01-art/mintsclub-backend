const mongoose = require('mongoose')

const systemSettingSchema = new mongoose.Schema(
    {
        royalityFee: { type: Number },
        platformFee: { type: Number },
    },
    { timestamps: true }
)

module.exports = mongoose.model('SystemSetting', systemSettingSchema)
