const moment = require('moment')
const NFT = require('../models/nfts.model')
const NftTokens = require('../models/nftTokens.model')
const nftAuctions = require('../models/auctions.model')
const Users = require('../models/users.model')
const ActivityModal = require('../models/item-activity.modal')
const Bid = require('../models/bids.model')
const Auction = require('../models/auctions.model')

const addFixedAuction = (request) => {
    request.currentPrice = Number(request.sellingConfig?.price?.amount)
    request.auctionEnded = false
    return request
}

const addTimedAuction = (request) => {
    request.currentPrice = Number(request?.sellingConfig?.startPrice?.amount)
    const startDate = moment(
        new Date(request?.sellingConfig?.duration?.startDate)
    )
        .utc(false)
        .toISOString()

    const endDate = moment(new Date(request?.sellingConfig?.duration?.endDate))
        .utc(false)
        .toISOString()

    request.sellingConfig.duration.startDate = startDate
    request.sellingConfig.duration.endDate = endDate
    request.auctionStartDate = startDate
    request.auctionEndDate = endDate
    request.highestBid = 0
    request.bid = []
    request.auctionEnded = false
    return request
}

const createNewNFTtoBuy = async (request, buyNftDetail, auctionDetail) => {
    try {
        const newPayload = {
            ownerId: request.userId,
            userId: request.userId,
            ownerAddress: request.ownerAddress,
            copies: auctionDetail?.copiesForAuction,
            name: buyNftDetail.name,
            description: buyNftDetail.description,
            fileType: buyNftDetail.fileType,
            creatorId: buyNftDetail.creatorId,
            collectionId: buyNftDetail.collectionId,
            categoryId: buyNftDetail.categoryId,
            currentPrice: 0,
            metaData: buyNftDetail.metaData,
            image: buyNftDetail.image,
            remainingCopies: auctionDetail?.copiesForAuction,
            activeAuction: null,
            tokenId: buyNftDetail?.lazyMinted
                ? request?.tokenId
                : buyNftDetail.tokenId,
            isApproved: buyNftDetail.isApproved,
            blockchainType: buyNftDetail.blockchainType,
            lazyMinted: false,
            appId: buyNftDetail.appId,
        }
        const nft = await NFT.create(newPayload)
        const nftTokenDetail = await NftTokens.findOne({
            nftId: request.nftId,
        })

        const payloadUpdateAuctionStatus = {
            auctionEnded: true,
            status: 'end',
        }

        await nftAuctions.findOneAndUpdate(
            { nftId: request.nftId },
            { $set: payloadUpdateAuctionStatus }
        )

        const nftTokenPayload = {
            nftToken: nftTokenDetail.nftToken,
            nftId: nft._id,
            tokenStandard: nftTokenDetail.tokenStandard,
        }

        await NftTokens.create(nftTokenPayload)

        const remainingCopies =
            buyNftDetail.remainingCopies - auctionDetail?.copiesForAuction

        const newPayloadCopies = {
            remainingCopies,
            activeAuction: null,
            currentPrice: 0,
        }

        const nftUpdate = await NFT.findByIdAndUpdate(
            { _id: buyNftDetail._id },
            { $set: newPayloadCopies }
        )

        if (nftUpdate) {
            const findUserDetail = await Users.findOne({
                _id: nftUpdate.ownerId,
            })

            const newTotalETH =
                findUserDetail.totalETH + Number(buyNftDetail.currentPrice)

            await Users.findByIdAndUpdate(
                { _id: nftUpdate.ownerId },
                { $set: { totalETH: newTotalETH } }
            )
        }
        const dataUpdated = await NFT.findByIdAndUpdate(
            { _id: buyNftDetail._id },
            { $set: { nftAuction: null } }
        )
        if (dataUpdated) {
            return true
        }
        return false
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const updateNFTForBuyNow = async (request, buyNftDetail, auctionDetail) => {
    try {
        const newPayload = {
            ownerId: request.userId,
            ownerAddress: request.ownerAddress,
            userId: request.userId,
            copies: auctionDetail?.copiesForAuction,
            remainingCopies: auctionDetail?.copiesForAuction,
            activeAuction: null,
            currentPrice: 0,
            lazyMinted: false,
        }
        const nftUpdate = await NFT.findByIdAndUpdate(
            { _id: buyNftDetail._id },
            { $set: newPayload }
        )

        if (nftUpdate) {
            const findUserDetail = await Users.findOne({
                _id: nftUpdate.ownerId,
            })

            const newTotalETH =
                findUserDetail.totalETH + Number(buyNftDetail.currentPrice)
            await Users.findByIdAndUpdate(
                { _id: nftUpdate.ownerId },
                { $set: { totalETH: newTotalETH } }
            )
            await NFT.findByIdAndUpdate(
                { _id: buyNftDetail._id },
                { $set: { nftAuction: null } }
            )
        }
        const payloadUpdateAuctionStatus = {
            auctionEnded: true,
            status: 'end',
        }

        const dataUpdated = await nftAuctions.findOneAndUpdate(
            { nftId: request.nftId },
            { $set: payloadUpdateAuctionStatus }
        )

        if (dataUpdated) {
            return true
        }
        return false
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const createNewNFTforEndAuction = async (bidData, auctionEndNft) => {
    try {
        let payload = {
            ownerId: bidData?.bidBy,
            userId: bidData?.bidBy,
            ownerAddress: bidData?.fromAddress,
            copies: auctionEndNft?.copiesForAuction,
            name: auctionEndNft?.nftId?.name,
            description: auctionEndNft?.nftId?.description,
            fileType: auctionEndNft?.nftId?.fileType,
            creatorId: auctionEndNft?.nftId?.creatorId,
            collectionId: auctionEndNft?.nftId?.collectionId,
            categoryId: auctionEndNft?.nftId?.categoryId,
            currentPrice: bidData?.nftId?.bidAmount,
            metaData: auctionEndNft?.nftId?.metaData,
            image: auctionEndNft?.nftId?.image,
            remainingCopies: auctionEndNft?.copiesForAuction,
            tokenId: auctionEndNft?.nftId?.tokenId,
            isApproved: auctionEndNft?.nftId?.isApproved,
            blockchainType: auctionEndNft?.nftId?.blockchainType,
        }

        const NFTCreated = await NFT.create(payload)

        const remainingCopies =
            auctionEndNft?.nftId?.remainingCopies -
            auctionEndNft?.copiesForAuction

        const nftUpdateNewPayload = { remainingCopies, currentPrice: 0 }

        const nftUpdate = await NFT.findByIdAndUpdate(
            { _id: auctionEndNft?.nftId?._id },
            { $set: nftUpdateNewPayload }
        )
        if (nftUpdate) {
            const findUserDetail = await Users.findOne({
                _id: nftUpdate.ownerId,
            })
            let newTotalETH = findUserDetail.totalETH + bidData.bidAmount

            await Users.findByIdAndUpdate(
                { _id: nftUpdate.ownerId },
                { $set: { totalETH: newTotalETH } }
            )
        }
        await Bid.findByIdAndUpdate(
            { _id: bidData._id },
            { $set: { isAccepted: true } }
        )

        const activityPayload = {
            nftId: auctionEndNft?.nftId?._id,
            ownerId: auctionEndNft?.nftId?.ownerId,
            fromAddress: auctionEndNft?.nftId?.ownerAddress,
            activityType: 'Transfer',
            toAddress: bidData?.fromAddress,
            price: bidData?.bidAmount,
        }

        const dataUpdated = await ActivityModal.create(activityPayload)
        if (dataUpdated) {
            return true
        }
        return false
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const updateNFTforEndAuction = async (bidData, auctionEndNft) => {
    try {
        const nftPayload = {
            ownerId: bidData.bidBy,
            userId: bidData.bidBy,
            ownerAddress: bidData.fromAddress,
            copies: auctionEndNft?.copiesForAuction,
            remainingCopies: auctionEndNft?.copiesForAuction,
            currentPrice: 0,
            tokenId: auctionEndNft?.nftId?.tokenId,
        }
        const nftUpdate = await NFT.findByIdAndUpdate(
            { _id: auctionEndNft?.nftId._id },
            { $set: nftPayload }
        )
        if (nftUpdate) {
            const findUserDetail = await Users.findOne({
                _id: nftUpdate.ownerId,
            })

            let newTotalETH = findUserDetail.totalETH + bidData.bidAmount

            await Users.findByIdAndUpdate(
                { _id: nftUpdate.ownerId },
                { $set: { totalETH: newTotalETH } }
            )
        }
        const activityPayload = {
            nftId: auctionEndNft?.nftId?._id,
            ownerId: auctionEndNft?.nftId?.ownerId,
            fromAddress: auctionEndNft?.nftId?.ownerAddress,
            activityType: 'Transfer',
            toAddress: bidData.fromAddress,
            price: bidData.bidAmount,
        }

        const dataUpdated = await ActivityModal.create(activityPayload)

        if (dataUpdated) {
            return true
        }
        return false
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const getAllActiveAuctionsForCronJob = async () => {
    const auctions = await Auction.find({
        status: 'active',
        sellingMethod: 2,
    }).lean()
    return auctions
}
const updateAuction = async (auctionId, data) => {
    const auctions = await Auction.findOneAndUpdate(
        { _id: auctionId },
        { status: data }
    )
    return auctions
}
const updateActivityforCancelList = async (cancelListData) => {
    const activityPayload = {
        nftId: cancelListData?.nftId?._id,
        ownerId: cancelListData?.nftId?.ownerId,
        fromAddress: cancelListData?.nftId?.ownerAddress,
        activityType: 'Cancelled Listing',
    }

    const dataUpdated = await ActivityModal.create(activityPayload)
    return dataUpdated
}
module.exports = {
    addFixedAuction,
    addTimedAuction,
    createNewNFTtoBuy,
    updateNFTForBuyNow,
    createNewNFTforEndAuction,
    updateNFTforEndAuction,
    getAllActiveAuctionsForCronJob,
    updateAuction,
    updateActivityforCancelList,
}
