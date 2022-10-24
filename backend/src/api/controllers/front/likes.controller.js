const LikesModal = require('../../models/likes.model')
let ObjectId = require('mongodb').ObjectId
// const validation = require('../../middlewares/front/likes')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

exports.likeDislike = async (req, res) => {
    try {
        const Payload = {
            nftId: req.body.nftId,
            userId: req.body.userId,
        }

        const checkAlreadyExist = await LikesModal.find({ ...Payload })
        if (checkAlreadyExist.length === 0) {
            //TODO: Add like
            const likeInserted = await LikesModal.create(Payload)
            return res.status(HTTP_STATUS_CODE.OK).send(likeInserted)
        }
        //TODO: Remove like
        const likeRemoved = await LikesModal.deleteOne(Payload)
        return res.status(HTTP_STATUS_CODE.OK).send(likeRemoved)
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
}

exports.getNftLikes = async (req, res) => {
    try {
        const payload = {
            nftId: req.query.nftId,
        }
        console.log('payload check', payload)
        const likes = await LikesModal.find(payload)
        res.status(HTTP_STATUS_CODE.OK).json({
            success: SUCCESS_STATUS.TRUE,
            data: likes,
        })
    } catch (error) {
       return  res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            success: SUCCESS_STATUS.FALSE,
            error,
        })
    }
}

exports.userNftLikes = async (req, res, next) => {
    try {
        const { userId } = req.query
        if (!userId)
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGN_IN_FIRST,
            })

        const likes = await LikesModal.find({ userId })

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.LIKES_NFT_FETCHED,
            data: likes,
        })
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).send({
            success: SUCCESS_STATUS.FALSE,error
        })
    }
}
exports.checkNftLikes = async (req, res) => {
    try {
        const Payload = {
            nftId: req.query.nftId,
            userId: req.query.userId,
        }
        const likedNft = await LikesModal.find(Payload)
        

        return res
            .status(HTTP_STATUS_CODE.OK)
            .send({ likedByUser: likedNft.length > 0 })
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).send({
            success: SUCCESS_STATUS.FALSE,error
        })
    }
   
}
