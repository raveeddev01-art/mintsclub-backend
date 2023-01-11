const { model, Schema } = require("mongoose");

const systemSettingSchema = new Schema(
  {
    chatFee: { type: Number, default: 2 },
    fee: { type: Number, default: 2 },
    placeOfferFeePercentage: { type: Number, default: 0.5 },
    royalityFeePercentage: { type: Number, default: 1 },
    franctionValues: { type: Array, default: [2, 4, 6] },
    mintPiqsolFee: { type: Number, default: 1 },
    buyNowPiqsolFee: { type: Number, default: 1 },
    makeAnOfferPiqsolFee: { type: Number, default: 1 },
    piqsolPriceInSol: { type: Number, default: 0.01 },
    chatDurationInDays: { type: Number, default: 1 },
    minimumStakeLockedAmount: { type: Number, default: 20 },
    stakingPlatformFee: { type: Number, default: 8.1 },
    listingItemTax: { type: Number, default: 2 },
  },
  { timestamps: true }
);

const Collection = model("SystemSetting", systemSettingSchema);
module.exports = Collection;