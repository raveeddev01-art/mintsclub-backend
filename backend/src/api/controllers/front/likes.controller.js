const LikesModal = require('../../models/likes.model')
let ObjectId = require('mongodb').ObjectId
const validation = require('../../middlewares/front/likes')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

exports.likeDislike = async (req, res, next) => {
    const Payload = {
        nftId: req.body.nftId,
        userId: req.body.userId,
        count: req.body.count,
    }
    const { error } = validation.validateLikesDislikeSchema(Payload)

    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }

    const foundCollection = await LikesModal.find({ nftId: Payload.nftId })
    const userId = req.body.userId
    const nftId = req.body.nftId
    const count = req.body.count

    if (foundCollection[0]) {
        // find if user already exist
        await LikesModal.findOne(
            {
                likes: { $elemMatch: { userId: Payload.userId } },
                nftId: Payload.nftId,
            },
            async function (err, user) {
                //error

                // if (err) {
                //     console.log('error', err)
                // }

                //if user exist then delete that record

                if (user) {
                    await LikesModal.updateOne(
                        { nftId: new ObjectId(Payload.nftId) },
                        { $inc: { count: -1 } }
                    ).exec()

                    const result = await LikesModal.updateOne(
                        { nftId: new ObjectId(Payload.nftId) },
                        {
                            $pull: {
                                likes: { userId: new ObjectId(Payload.userId) },
                            },
                        },
                        { multi: true }
                    )
                    res.status(HTTP_STATUS_CODE.OK).send(result)
                }
                //if user not found then insert a user like
                else {
                    const data = {
                        userId,
                    }
                    try {
                        await LikesModal.updateOne(
                            { nftId: new ObjectId(Payload.nftId) },
                            { $inc: { count: 1 } },

                            { new: true, upsert: true }
                        ).exec()

                        const insertedLike = await LikesModal.updateOne(
                            { nftId: new ObjectId(Payload.nftId) },
                            { $push: { likes: data } },
                            { new: true, upsert: true }
                        ).exec()
                        res.status(HTTP_STATUS_CODE.OK).send({
                            success: SUCCESS_STATUS.TRUE,
                            message: SUCCESS_MESSAGE.LIKES_RECORD_UPDATED,
                            result: insertedLike,
                        })
                    } catch (error) {
                        return next(error)
                    }
                }
            }
        )
    }

    //if collecton not found
    else {
        let data = {
            nftId,
            count,
            likes: [
                {
                    userId,
                },
            ],
        }

        try {
            const result = await LikesModal.create(data)
            res.status(HTTP_STATUS_CODE.CREATED).json({
                success: true,
                data: result,
            })
        } catch (error) {
            res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                success: SUCCESS_STATUS.FALSE,
                error: error,
            })
        }
    }
}

exports.get = async (req, res) => {
    try {
        const likes = await LikesModal.find()
        res.status(HTTP_STATUS_CODE.CREATED).json({
            success: SUCCESS_STATUS.TRUE,
            data: likes,
        })
    } catch (error) {
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            success: SUCCESS_STATUS.FALSE,
            error: error,
        })
    }
}

exports.userNftLikes = async (req, res, next) => {
    try {
        const { userId } = req.query

        const { error } = validation.validateId(userId)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        if (!userId)
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGN_IN_FIRST,
            })

        const likes = await LikesModal.find({}, 'nftId').where(
            'likes.userId',
            userId
        )

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.LIKES_NFT_FETCHED,
            data: likes,
        })
    } catch (error) {
        return next(error)
    }
}
