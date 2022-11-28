const mongoose = require('mongoose')

const systemSettingSchema = new mongoose.Schema(
    {
        sellerFeeBasisPoints: { type: Number, default: 200 },
    },
    { timestamps: true }
)

module.exports = mongoose.model('SystemSetting', systemSettingSchema)
