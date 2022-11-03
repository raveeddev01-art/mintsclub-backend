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
            console.log(
                '🚀 ~ file: AuctionStatusChangeJob.js ~ */1 * * * * */1 * * * * line 14 ~ cron.schedule ~ auctions',
                auctions
            )
            if (!auctions.length) return false

            auctions.forEach(async (auction) => {
                const { _id, auctionEndDate } = auction

                const auctionEndDateTime = moment(auctionEndDate)
                const remainingTime = auctionEndDateTime.diff(
                    moment(),
                    'seconds'
                )
                if (remainingTime <= 0) {
                    await updateAuction(_id, 'claimNft')
                }
            })
        })
    } catch (err) {
        console.log('Auction status Change Job Error ===> ', err)
    }
}
