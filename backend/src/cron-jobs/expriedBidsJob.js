const cron = require('node-cron');
const moment = require('moment');
const Bid = require('../api/models/bids.model');
const nft = require('../api/models/nfts.model');

module.exports.startCron = () => {
  try {
    cron.schedule('*/2 * * * * ', async () => {
      const auctionEndNftsList = await nft.find({
        auctionEndDate: { $exists: true, $nin: null },
      });
      if (auctionEndNftsList.length > 0) {
        auctionEndNftsList.forEach(async (auctionEndNft) => {
          // const isExpire = auctionEndNft.auctionEndDate.diff(moment());
          let endDate = new moment(auctionEndNft.auctionEndDate);
          let currentDateTime = new moment();
          //var endData = "2022-03-11T00:00:00.000+00:00";
          //let duration = currentDateTime - auctionEndNft.auctionEndDate;
          const duration = moment.duration(endDate.diff(currentDateTime));
          const time = duration.asMinutes();
          //console.log('auctionEndNft', endDate, currentDateTime, time);
          if (time <= 0) {
            bid = await Bid.find({ nftId: auctionEndNft._id });
            console.log('bid', bid);
            bidData = bid[0];
            
            let payload = {
              ownerId: bidData.bidBy,
              ownerAddress: bidData.fromAddress,
              auctionEndDate: null,
              auctionEndTime: null,
              auctionStartDate: null,
              auctionStartTime: null,
              sellingMethod: 0,
              sellingConfig: {
                method: 0,
                startPrice: {
                  currency: null,
                  amount: 0,
                },
                duration: {
                  startTime: null,
                  endTime: null,
                },
                reservePrice: {
                  currency: null,
                  amount: 0,
                },
              },
            };
            nftUpdate = await nft.findByIdAndUpdate(
              { _id: bidData.nftId },
              { $set: payload },
              { new: true }
            );
          }

          // auctionExpiryDate = auctionEndNft.auctionEndDate;
          // console.log('auctionEndNft.auctionEndDate', auctionExpiryDate);
          // expiryDate = moment(auctionExpiryDate, 'DD.MM.YYYY HH.mm.ss');
          // const currentDate = moment();
          // console.log('expiry diff', expiryDate.diff(currentDate));

          //console.log('isExpire', isExpire);
          // console.log('currentDate', currentDate);
          // console.log('expiryDate', expiryDate);
          // if (isExpire) {
          //   bid = await Bid.find({ nftId: auctionEndNft._id });
          //   if (bid) {
          //     acceptedBid = Bid.findByIdAndUpdate({ isAccepted: true });
          //     bidData = bid[0];
          //     let payload = {
          //       ownerId: bidData.bidBy,
          //       ownerAddress: bidData.fromAddress,
          //       auctionEndDate: null,
          //       auctionEndTime: null,
          //       auctionStartDate: null,
          //       auctionStartTime: null,
          //       sellingMethod: 0,
          //       sellingConfig: {
          //         method: 0,
          //         startPrice: {
          //           currency: null,
          //           amount: 0,
          //         },
          //         duration: {
          //           startTime: null,
          //           endTime: null,
          //         },
          //         reservePrice: {
          //           currency: null,
          //           amount: 0,
          //         },
          //       },
          //     };
          //     nftUpdate = await nft.findByIdAndUpdate(
          //       { _id: bidData.nftId },
          //       { $set: payload },
          //       { new: true }
          //     );
          //     console.log('ownership transffered');
          //   }
          // }
        });
      }

      //console.log('testing', auctionEndNftsList);

      //const currentDate = new Date(); //2022-03-10T07:20:00.247Z
      //console.log('currentDate', currentDate);
      // console.log('expiredDate.diff(date1)', expiredDate.diff(date1));
      // if (expiredDate) {
      //   console.log('nft auction is expired');
      // }
      // console.log('nft auction is not expired');

      //const auctionEndNfts = await nft.find({});
      //const allBids = await Bid.find();

      // console.log('allBids => ', allBids);

      // allBids.forEach(async (bid) => {
      //   console.log('bid', bid);
      //   const date1 = moment();
      //   const date2 = moment(bid.expiryDate, 'DD.MM.YYYY HH.mm.ss');
      //   const isExpire = date2.diff(date1) > 0 ? false : true;
      //   if (isExpire) {
      //     await Bid.findByIdAndUpdate({ _id: bid._id }, { isClaimable: true });
      //   }
      // });
    });
  } catch (err) {
    console.log(error);
  }
};
