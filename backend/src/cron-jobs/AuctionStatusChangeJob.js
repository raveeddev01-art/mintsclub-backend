const cron = require('node-cron')
const moment = require('moment')
const {
    getAllActiveAuctionsForCronJob,
    updateAuction,
    updateAuctionFields,
} = require('../../../backend/src/api/helpers/auction.helper')
const socket = require('../utils/socket')

module.exports.startCron = () => {
    try {
        cron.schedule('*/1 * * * *', async () => {
            const auctions = await getAllActiveAuctionsForCronJob()

            if (!auctions.length) return false

            auctions.forEach(async (auction) => {
                const {
                    _id,
                    auctionEndDate,
                    auctionStartDate,
                    auctionStarted,
                } = auction

                const auctionStartDateTime = moment(auctionStartDate)
                const remainingStartTime = auctionStartDateTime.diff(
                    moment(),
                    'seconds'
                )

                const auctionEndDateTime = moment(auctionEndDate)
                const remainingTime = auctionEndDateTime.diff(
                    moment(),
                    'seconds'
                )
                if (remainingTime <= 0) {
                    if (auction.bids.length > 0) {
                        await updateAuction(_id, 'claimNft')
                    }

                    if (auction.bids.length === 0) {
                        await updateAuction(_id, 'reclaimNft')
                    }

                    socket?.io
                        ?.to(`${auction?.nftId}`)
                        .emit('auctionTimeEnded', {
                            auctionId: _id,
                            nftId: auction?.nftId,
                        })
                }

                if (remainingStartTime <= 0 && !auctionStarted) {
                    await updateAuctionFields(_id, { auctionStarted: true })
                    socket?.io?.to(`${auction?.nftId}`).emit('auctionStarted', {
                        auctionId: _id,
                        nftId: auction?.nftId,
                    })
                    socket?.io.emit('auctionLive', {
                        auctionId: _id,
                        nftId: auction?.nftId,
                    })
                }
            })
        })
    } catch (err) {
        console.log('Auction status Change Job Error ===> ', err)
    }
}
