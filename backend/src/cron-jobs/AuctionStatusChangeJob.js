const cron = require('node-cron')
const moment = require('moment')
const {
    getAllActiveAuctionsForCronJob,
    updateAuction,
} = require('../../../backend/src/api/helpers/auction.helper')

module.exports.startCron = () => {
    try {
        cron.schedule('*/1 * * * *', async () => {
            const auctions = await getAllActiveAuctionsForCronJob()

            if (!auctions.length) return false

            auctions.forEach(async (auction) => {
                const { _id, auctionEndDate } = auction

                const auctionEndDateTime = moment(auctionEndDate)
                const remainingTime = auctionEndDateTime.diff(
                    moment(),
                    'seconds'
                )
                if (remainingTime <= 0 && auction.bids.length > 0) {
                    await updateAuction(_id, 'claimNft')
                }
                if (remainingTime <= 0 && auction.bids.length === 0) {
                    await updateAuction(_id, 'reclaimNft')
                }
            })
        })
    } catch (err) {
        console.log('Auction status Change Job Error ===> ', err)
    }
}
