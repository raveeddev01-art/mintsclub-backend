const mongoose = require('mongoose')
const fileHistorySchema = new mongoose.Schema(
    {
        fileName: { type: String },
        nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nft' },
        zipFile: { type: String },
        batchId: { type: mongoose.Types.ObjectId, ref: 'BatchUpload' },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('FileHistory', fileHistorySchema)
