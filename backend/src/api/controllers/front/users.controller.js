/* eslint-disable no-undef */
// const fs = require('fs')
const ObjectId = require('mongoose').Types.ObjectId
const UserModal = require('../../models/users.model')
// const { addImage } = require('../../utils/uploadImage')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const validation = require('../../middlewares/front/validation')
const validUrl = require('valid-url')
const mailchimp = require('@mailchimp/mailchimp_marketing')
const { mailChimp } = require('../../../config/vars')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

mailchimp.setConfig({
    apiKey: mailChimp.apiKey,
    server: mailChimp.server,
})
exports.create = async (req, res, next) => {
    try {
        const user = await UserModal.create(req.body)
        return res
            .status(HTTP_STATUS_CODE.OK)
            .send({ success: SUCCESS_STATUS.TRUE, data: user })
    } catch (error) {
        return next(error)
    }
}

exports.updateProfile = async (req, res, next) => {
    try {
        if (req.body.isApproved) {
            let payload = {
                userId: req.body.userId,
                isApproved: true,
            }

            const user = await UserModal.findByIdAndUpdate(
                { _id: ObjectId(payload.userId) },
                { $set: payload },
                { new: true }
            )
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                user,
                message: SUCCESS_MESSAGE.PROFILE_UPDATED,
            })
        }

        payload = {
            email: req.body.email,
            username: req.body.username,
            userId: req.body.userId,
            bio: req.body.bio,
        }

        const { error } = validation.validateUserProfile(payload)
        payload.profileImage = req.body.profileImage
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        if (req.body.twitterLink && !validUrl.isUri(req.body.twitterLink)) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.VALID_TWITTER_LINK,
            })
        } else {
            payload.twitterLink = req.body.twitterLink
        }
        if (req.body.instaLink && !validUrl.isUri(req.body.instaLink)) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.VALID_INSTAGRAM_LINK,
            })
        } else {
            payload.instaLink = req.body.instaLink
        }

        if (req.body.webLink && !validUrl.isUri(req.body.webLink)) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.VALID_WEBSITE_LINK,
            })
        } else {
            payload.webLink = req.body.webLink
        }

        let imagesPayload = {
            profileImage: req.body.profileImage,
            bannerImage: req.body.bannerImage,
        }

        const newPayload = { ...payload, ...imagesPayload }

        let user = await UserModal.findByIdAndUpdate(
            { _id: ObjectId(newPayload.userId) },
            { $set: newPayload },
            { new: true }
        )
        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            user,
            message: SUCCESS_MESSAGE.PROFILE_UPDATED,
        })
    } catch (error) {
        return next(error)
    }
}
exports.getCreators = async (req, res, next) => {
    try {
        const users = await UserModal.aggregate([
            {
                $match: {},
            },
            {
                $project: {
                    profileImage: 1,
                    username: 1,
                    address: 1,
                },
            },
        ])

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            data: users,
            message: SUCCESS_MESSAGE.AUTHORS_FETCHED,
        })
    } catch (error) {
        return next(error)
    }
}

exports.topSellers = async (req, res, next) => {
    try {
        let { page, limit } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = UserModal.countDocuments({})

        const pipeline = [
            {
                $match: { totalETH: { $ne: 0 } },
            },
            {
                $sort: { totalETH: -1 },
            },
        ]
        const newTotal = UserModal.aggregate(pipeline)
        const topSellers = await Promise.all([total, newTotal])
        if (page > Math.ceil(topSellers[0] / limit) && topSellers[0] > 0)
            page = Math.ceil(topSellers[0] / limit)
        const totalRecords = topSellers[1]?.length

        pipeline.push({ $skip: limit * (page - 1) })
        pipeline.push({ $limit: limit })

        const users = await UserModal.aggregate(pipeline)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.TOP_SELLERS_FETCHED,
            data: {
                topSellers: users,
                pagination: {
                    page,
                    limit,
                    totalRecords,
                    pages:
                        Math.ceil(totalRecords / limit) <= 0
                            ? 1
                            : Math.ceil(totalRecords / limit),
                },
            },
        })
    } catch (error) {
        return next(error)
    }
}
exports.getUser = async (req, res, next) => {
    try {
        let { userId } = req.params

        const payload = { userId }

        const { error } = validation.validateUser(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        const user = await UserModal.findOne({ _id: ObjectId(payload.userId) })

        if (user) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                data: user,
                message: SUCCESS_MESSAGE.USER_FETCHED,
            })
        }
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.USER_DOES_NOT_EXIST,
        })
    } catch (error) {
        return next(error)
    }
}

exports.subscribeUser = async (req, res, next) => {
    const listUniqueId = mailChimp.listId
    try {
        await mailchimp.lists.addListMember(listUniqueId, {
            email_address: req.body.email,
            status: 'subscribed',
            tags: ['mintsclub.io'],
        })
        res.status(HTTP_STATUS_CODE.CREATED).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.SUBSCRIBED_SUCCESSFULLY,
        })
    } catch (error) {
        if (
            JSON.parse(error.response.text).detail.includes(
                'already a list member'
            )
        ) {
            res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.EMAIL_ALREADY_SUBSCRIBED,
            })
        } else {
            res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: JSON.parse(error.response.text).detail,
            })
        }
        // return next(JSON.parse(error.response.text));
    }
}
exports.signUser = async (req, res, next) => {
    try {
        const { address } = req.params
        // const { error } = validation.validateAddress({ address })
        // if (error) {
        //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
        //         success: SUCCESS_STATUS.FALSE,
        //         message: error?.details[0]?.message,
        //     })
        // }
        const result = await UserModal.find({ address })
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            users: result,
        })
    } catch (error) {
        return next(error)
    }
}
exports.createUser = async (req, res, next) => {
    try {
        let payload = {
            address: req.body.address,
        }
        const { error } = validation.validateAddress(payload)
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        payload.profileImage = null
        payload.totalETH = 0

        payload.nounce = Math.floor(Math.random() * 1000000)
        let user = await UserModal.create(payload)
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TURE,
            data: user,
            message: SUCCESS_MESSAGE.USER_CREATED,
        })
    } catch (error) {
        return next(error)
    }
}

exports.authenticate = async (req, res, next) => {
    try {
        let address = req.body.publicAddress
        // let payload=req.body
        // const { error } = validation.validateAucthentication(payload)
        // if (error) {
        //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
        //         success: SUCCESS_STATUS.FALSE,
        //         message: error?.details[0]?.message,
        //     })
        // }
        let user = await UserModal.findOne({ address })
        if (!user) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NO_ACCOUNT_EXIST,
            })
        }
        const accessToken = await user.token()
        user = user.transform()
        user.isApproved = true
        const data = {
            ...user,
            accessToken,
        }
        // --snip--
        const msg = `I am signing my one-time nonce: ${user.nounce}`
        const msgBuffer = ethUtil.bufferToHex(Buffer.from(msg, 'utf8'))
        const signAddress = sigUtil.recoverPersonalSignature({
            data: msgBuffer,
            sig: req.body.signature,
        })
        // ecrecover matches the initial publicAddress

        if (signAddress.toLowerCase() === address.toLowerCase()) {
            user.nounce = Math.floor(Math.random() * 1000000)
            await UserModal.findByIdAndUpdate(
                { _id: user._id },
                { $set: user },
                { new: true }
            )

            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.USER_AUTHENTICATED,
                data,
            })
        } else {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGNATURE_VERIFICATION_FAILED,
            })
        }
    } catch (err) {
        return next(err)
    }
}
