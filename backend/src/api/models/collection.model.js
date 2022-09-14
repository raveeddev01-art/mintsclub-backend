const mongoose = require('mongoose')
const NFT = require('../models/nfts.model')

/**
 * Collection Schema
 * @private
 */
const CollectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: { type: String, required: true },
        logo: { type: String, required: true },
        featuredImg: { type: String },
        banner: { type: String },
        url: { type: String },
        description: { type: String },
        ownerAddress: { type: String },
        nft: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: NFT,
            },
        ],
    },
    { timestamps: true }
)

// bookSchema.pre('findOne', function() {
//     let keys = this.getPopulatedPaths(); // ['author']
//   });

// CollectionSchema.post('findOne', async function (doc, next) {
//     // const doc = await this.model.findOne(this.getQuery())
//     console.log('docccccc', doc)
//     let collection = doc
//     collection.items = await NFT.countDocuments({
//         collectionId: collection?._id,
//     })

//     let owners = await NFT.find({ collectionId: collection?._id }).distinct(
//         'collectionId'
//     )
//     collection.owners = owners?.length || 0

//     return collection
// })

/**
 * @typedef Collection
 */

module.exports = mongoose.model('Collection', CollectionSchema)
