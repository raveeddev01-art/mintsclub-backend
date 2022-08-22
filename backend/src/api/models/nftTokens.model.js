const mongoose = require('mongoose')

const NFtTokensSchema = new mongoose.Schema(
    {
        nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT' },
        nftToken: { type: String },
        tokenStandard: { type: String },
    },
    { timestamps: true }
)

module.exports = mongoose.model('NftTokens', NFtTokensSchema)
