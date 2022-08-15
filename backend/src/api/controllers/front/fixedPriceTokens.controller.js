const FixedPriceTokens = require("../../models/fixedPriceTokens.model");

exports.addNftToken = async (req, res) => {
  try {
    let result = await FixedPriceTokens.create(req.body);

    res.send({
      status: "success",
      data: result,
    });
  } catch (err) {
    res.status(400).send({
      status: "failure",
      error: err,
    });
  }
};

exports.getNftTokens = async (req, res) => {
  try {
    let result = await FixedPriceTokens.find();

    res.status(200).send({
      status: "success",
      data: result,
    });
  } catch (err) {
    res.status(400).send({
      status: "failure",
      error: err,
    });
  }
};

exports.getNftToken = async (req, res) => {
  const id = req.params.id;

  try {
    let result = await FixedPriceTokens.findOne({ nftId: id });

    res.status(200).send({
      status: "success",
      data: result,
    });
  } catch (err) {
    res.status(400).send({
      status: "failure",
      error: err,
    });
  }
};
