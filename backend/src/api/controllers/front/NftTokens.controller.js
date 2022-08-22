const NftTokens = require('../../models/nftTokens.model')

exports.addNftToken = async (req, res, next) => {
    try {
        let nftToken = await NftTokens.create(req.body)

        res.send({
            status: 'success',
            data: nftToken,
        })
    } catch (err) {
        return next(err)
    }
}

exports.getNftTokens = async (req, res) => {
    try {
        let nftTokens = await NftTokens.find()

        res.status(200).send({
            status: 'success',
            data: nftTokens,
        })
    } catch (err) {
        res.status(400).send({
            status: 'failure',
            error: err,
        })
    }
}
