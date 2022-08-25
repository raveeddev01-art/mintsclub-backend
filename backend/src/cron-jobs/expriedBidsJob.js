const cron = require('node-cron')
// const moment = require('moment')
const Bid = require('../api/models/bids.model')
const nft = require('../api/models/nfts.model')
const Collection = require('../api/models/collection.model')
const NftTokens = require('../api/models/nftTokens.model')
const Users = require('../api/models/users.model')
const ItemActivity = require('../api/models/item-activity.modal')

module.exports.startCron = () => {
    try {
        cron.schedule('*/3 * * * * * ', async () => {
            const auctionEndNftsList = await nft.find({
                auctionEndDate: { $exists: true, $nin: null },
            })

            if (auctionEndNftsList.length > 0) {
                for (const auctionEndNft of auctionEndNftsList) {
                    // auctionEndNftsList.forEach(async (auctionEndNft) => {

                    // let endDate = moment(auctionEndNft.auctionEndDate).utc(true)
                    // let currentDateTime = new moment().utc(true)

                    // if (endDate.diff(currentDateTime) <= 0) {
                    if (auctionEndNft.auctionEnded) {
                        const bid = await Bid.find({
                            nftId: auctionEndNft._id,
                            bidAmount: auctionEndNft.highestBid,
                        })

                        if (bid.length > 0) {
                            const bidData = bid[0]
                            if (
                                auctionEndNft.remainingCopies >
                                auctionEndNft.copiesForAuction
                            ) {
                                const payload = {
                                    ownerId: bidData.bidBy,
                                    userId: bidData.bidBy,
                                    ownerAddress: bidData.fromAddress,
                                    copies: auctionEndNft.copiesForAuction,
                                    name: auctionEndNft.name,
                                    description: auctionEndNft.description,
                                    fileType: auctionEndNft.fileType,
                                    creatorId: auctionEndNft.creatorId,
                                    collectionId: auctionEndNft.collectionId,
                                    categoryId: auctionEndNft.categoryId,
                                    currentPrice: bidData.bidAmount,
                                    auctionEnded: false,
                                    metaData: auctionEndNft.metaData,
                                    image: auctionEndNft.image,
                                    highestBid: 0,
                                    remainingCopies:
                                        auctionEndNft.copiesForAuction,
                                }

                                const NFT = await nft.create(payload)

                                const collectionRecord =
                                    await Collection.findOne({
                                        _id: auctionEndNft.collectionId,
                                    })

                                collectionRecord.nft.push(NFT._id)
                                collectionRecord.save()

                                const nftTokenDetail = await NftTokens.findOne({
                                    nftId: auctionEndNft._id,
                                })

                                const nftTokenPayload = {
                                    nftToken: nftTokenDetail.nftToken,
                                    nftId: NFT._id,
                                    tokenStandard: nftTokenDetail.tokenStandard,
                                }

                                await NftTokens.create(nftTokenPayload)

                                const remainingCopies =
                                    auctionEndNft.copies -
                                    auctionEndNft.copiesForAuction

                                const newPayload = {
                                    copiesForAuction: 0,
                                    remainingCopies: remainingCopies,
                                    auctionEndDate: null,
                                    auctionStartDate: null,
                                    auctionEnded: false,
                                    sellingMethod: 0,
                                    sellingConfig: {
                                        startPrice: {
                                            currency: null,
                                            amount: 0,
                                        },
                                        duration: {
                                            startTime: null,
                                            endTime: null,
                                        },
                                    },
                                }

                                const nftUpdate = await nft.findByIdAndUpdate(
                                    { _id: auctionEndNft._id },
                                    { $set: newPayload }
                                    // { new: true }
                                )
                                if (nftUpdate) {
                                    const findUserDetail = await Users.findOne({
                                        _id: nftUpdate.ownerId,
                                    })

                                    const newTotalETH =
                                        findUserDetail.totalETH +
                                        bidData.bidAmount

                                    await Users.findByIdAndUpdate(
                                        { _id: nftUpdate.ownerId },
                                        { $set: { totalETH: newTotalETH } }
                                    )
                                }

                                await Bid.findByIdAndUpdate(
                                    { _id: bidData._id },
                                    { $set: { isAccepted: true } }
                                    // { new: true }
                                )

                                const activityPayload = {
                                    nftId: auctionEndNft._id,
                                    ownerId: auctionEndNft.ownerId,
                                    fromAddress: auctionEndNft.ownerAddress,
                                    activityType: 'Transfer',
                                    toAddress: bidData.fromAddress,
                                    price: bidData.bidAmount,
                                }

                                await ItemActivity.create(activityPayload)
                            } else {
                                const payload = {
                                    ownerId: bidData.bidBy,
                                    userId: bidData.bidBy,
                                    ownerAddress: bidData.fromAddress,
                                    auctionEndDate: null,
                                    auctionStartDate: null,
                                    sellingMethod: 0,
                                    copies: auctionEndNft.copiesForAuction,
                                    remainingCopies:
                                        auctionEndNft.copiesForAuction,
                                    copiesForAuction: 0,
                                    currentPrice: auctionEndNft.highestBid,
                                    auctionEnded: false,
                                    highestBid: 0,
                                    sellingConfig: {
                                        startPrice: {
                                            currency: null,
                                            amount: 0,
                                        },
                                        duration: {
                                            startTime: null,
                                            endTime: null,
                                        },
                                    },
                                }

                                const nftUpdate = await nft.findByIdAndUpdate(
                                    { _id: auctionEndNft._id },
                                    { $set: payload }
                                    // { new: true }
                                )
                                if (nftUpdate) {
                                    const findUserDetail = await Users.findOne({
                                        _id: nftUpdate.ownerId,
                                    })

                                    const newTotalETH =
                                        findUserDetail.totalETH +
                                        bidData.bidAmount

                                    await Users.findByIdAndUpdate(
                                        { _id: nftUpdate.ownerId },
                                        { $set: { totalETH: newTotalETH } }
                                    )

                                    const activityPayload = {
                                        nftId: auctionEndNft._id,
                                        ownerId: auctionEndNft.ownerId,
                                        fromAddress: auctionEndNft.ownerAddress,
                                        activityType: 'Transfer',
                                        toAddress: bidData.fromAddress,
                                        price: bidData.bidAmount,
                                    }

                                    await ItemActivity.create(activityPayload)
                                }
                            }
                        }
                        const payload = {
                            auctionEndDate: null,
                            auctionStartDate: null,
                            sellingMethod: 0,
                            copiesForAuction: 0,
                            auctionEnded: false,
                            sellingConfig: {
                                startPrice: {
                                    currency: null,
                                    amount: 0,
                                },
                                duration: {
                                    startTime: null,
                                    endTime: null,
                                },
                            },
                        }

                        await nft.findByIdAndUpdate(
                            { _id: auctionEndNft._id },
                            { $set: payload }
                            // { new: true }
                        )
                    }
                }
            }
        })
    } catch (err) {
        console.log(err)
    }
}
