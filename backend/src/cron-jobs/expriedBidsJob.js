const cron = require('node-cron');
const moment = require('moment');
const Bid = require('../api/models/bids.model');
const nft = require('../api/models/nfts.model');
const Collection = require('../api/models/collection.model');
const NftTokens = require('../api/models/nftTokens.model');
module.exports.startCron = () => {
  try {
    cron.schedule('*/1 * * * * ', async () => {
      const auctionEndNftsList = await nft.find({
        auctionEndDate: { $exists: true, $nin: null },
      });

      if (auctionEndNftsList.length > 0) {
        auctionEndNftsList.forEach(async (auctionEndNft) => {
          let endDate = moment(auctionEndNft.auctionEndDate).utc(false);
          let currentDateTime = new moment();
          //console.log('datestime', endDate, currentDateTime);

          //var endData = "2022-03-11T00:00:00.000+00:00";
          //let duration = currentDateTime - auctionEndNft.auctionEndDate;

          // const duration = moment.duration(endDate.diff(currentDateTime));
          // const time = duration.asMinutes();

          if (currentDateTime.diff(endDate) <= 0) {
            bid = await Bid.find(
              { nftId: auctionEndNft._id },
              { isAccepted: false }
            );

            if (bid.length > 0) {
              let bidData = bid[0];

              if (auctionEndNft.copies > auctionEndNft.copiesForAuction) {
                let payload = {
                  ownerId: bidData.bidBy,
                  ownerAddress: bidData.fromAddress,
                  copies: auctionEndNft.copiesForAuction,
                  name: auctionEndNft.name,
                  description: auctionEndNft.description,
                  fileType: auctionEndNft.fileType,
                  creatorId: auctionEndNft.creatorId,
                  collectionId: auctionEndNft.collectionId,
                  categoryId: auctionEndNft.categoryId,
                  currentPrice: auctionEndNft.currentPrice,
                  metaData: auctionEndNft.metaData,
                  image: auctionEndNft.image,
                  highestBid: 0,
                };

                const NFT = await nft.create(payload);
                // console.log('creating new NFT', NFT, NFT.length);
                // console.log('NFT._id', NFT._id);

                // deleteNFT = await nft.delete({ _id: NFT._id });

                if (NFT) {
                  let collectionRecord = await Collection.findOne({
                    _id: auctionEndNft.collectionId,
                  });

                  collectionRecord.nft.push(NFT._id);
                  collectionRecord.save();
                }
                nftTokenDetail = await NftTokens.findOne({
                  nftId: auctionEndNft._id,
                });
                let nftTokenPayload = {
                  nftToken: nftTokenDetail.nftToken,
                  nftId: NFT._id,
                  tokenStandard: nftTokenDetail.tokenStandard,
                };
                let nftToken = await NftTokens.create(nftTokenPayload);
                const remainingCopies =
                  auctionEndNft.copies - auctionEndNft.copiesForAuction;
                let newPayload = {
                  copiesForAuction: 0,
                  copies: remainingCopies,
                  auctionEndDate: null,
                  auctionStartDate: null,
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
                };

                nftUpdate = await nft.findByIdAndUpdate(
                  { _id: auctionEndNft._id },
                  { $set: newPayload },
                  { new: true }
                );

                updateBid = await Bid.findByIdAndUpdate(
                  { _id: bidData._id },
                  { $set: { isAccepted: true } },
                  { new: true }
                );
              } else {
                //console.log('else is working');
                let payload = {
                  ownerId: bidData.bidBy,
                  ownerAddress: bidData.fromAddress,
                  auctionEndDate: null,
                  auctionStartDate: null,
                  sellingMethod: 0,
                  copies: 0,
                  copiesForAuction: 0,
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
                };
                nftUpdate = await nft.findByIdAndUpdate(
                  { _id: auctionEndNft._id },
                  { $set: payload },
                  { new: true }
                );
              }
            }
          }
        });
      }
    });
  } catch (err) {
    console.log(error);
  }
};
