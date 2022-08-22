const FixedPriceTokens = require('../../models/fixedPriceTokens.model')
const validation = require('../../middlewares/front/fixedPriceTokenValidation.js')

exports.addNftToken = async (req, res) => {
    try {
        let payload = req.body
        const { error } = validation.validateAddFixedPriceToken(payload)
        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }
        let result = await FixedPriceTokens.create(payload)

        res.send({
            status: 'success',
            data: result,
        })
    } catch (err) {
        res.status(400).send({
            status: 'failure',
            error: err,
        })
    }
}

exports.getNftTokens = async (req, res) => {
    try {
        let result = await FixedPriceTokens.find()

        res.status(200).send({
            status: 'success',
            data: result,
        })
    } catch (err) {
        res.status(400).send({
            status: 'failure',
            error: err,
        })
    }
}

exports.getNftToken = async (req, res) => {
    const id = req.params.id
    const { error } = validation.validateNFTid(id)

    if (error) {
        let errorMsg = error.details[0].message
        return res.status(400).send({ status: false, message: errorMsg })
    }
    try {
        let result = await FixedPriceTokens.findOne({ nftId: id })

        res.status(200).send({
            status: 'success',
            data: result,
        })
    } catch (err) {
        res.status(400).send({
            status: 'failure',
            error: err,
        })
    }
}
