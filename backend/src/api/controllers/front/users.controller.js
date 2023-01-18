/* eslint-disable no-undef */
const ObjectId = require('mongoose').Types.ObjectId
const UserModal = require('../../models/users.model')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const validUrl = require('valid-url')
const mailchimp = require('@mailchimp/mailchimp_marketing')
const { mailChimp } = require('../../../config/vars')
const nacl = require('tweetnacl')
const algosdk = require('algosdk')
const { base58_to_binary } = require('base58-js')
const helpers = require('../../helpers')
const atob = require('atob')
const { uploadFileToS3 } = require('../../utils/s3Bucket.js')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const fs = require('fs')

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
            let user = await helpers.user.approvedUserProfileUpdate(req.body)
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
        //upload files
        if (req.file) {
            const profileRes = await uploadFileToS3(
                req.file.path,
                req.file.filename
            )
            if (!profileRes.success) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: profileRes.err,
                })
            }
            payload.profileImage = profileRes.file
            console.log(profileRes.file, 'req.file')
        } else {
            payload.profileImage = req.body.profileImage
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

        // let imagesPayload = {
        //     profileImage: req.body.profileImage,
        //     bannerImage: req.body.bannerImage,
        // }

        const newPayload = { ...payload }
        let user = await helpers.user.updateUserProfile(newPayload)
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

        page = parseInt(page || '1')
        limit = parseInt(limit || '10')

        const pipeline = [
            {
                $match: { totalETH: { $ne: 0 } },
            },
            {
                $sort: { totalETH: -1 },
            },
            {
                $facet: {
                    metadata: [
                        { $count: 'total' },
                        { $addFields: { page } },
                        { $addFields: { limit } },
                    ],
                    data: [{ $skip: limit * (page - 1) }, { $limit: limit }],
                },
            },
        ]

        const users = await UserModal.aggregate(pipeline)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.TOP_SELLERS_FETCHED,
            data: {
                topSellers: users[0].data,
                pagination: {
                    ...users[0],
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
            res.status(HTTP_STATUS_CODE.OK).send({
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
        const { blockchainType } = req.body

        const result = await UserModal.find({ address, blockchainType })
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            users: result,
            blockchainType,
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
        
        payload.profileImage = null
        payload.totalETH = 0
        payload.blockchainType = req.body.blockchainType
        payload.isApproved = false

        payload.nounce = Math.floor(Math.random() * 1000000)
        let user = await UserModal.create(payload)
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            data: user,
            message: SUCCESS_MESSAGE.USER_CREATED,
        })
    } catch (error) {
        return next(error)
    }
}

exports.authenticate = async (req, res, next) => {
    try {
        let { publicAddress: address, blockchainType, signature } = req.body
        console.log(
            '🚀 ~ file: users.controller.js ~ line 299 ~ exports.authenticate= ~ addresss',
            address,
            req.body
        )

        let user = await UserModal.findOne({ address, blockchainType })
        if (!user) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NO_ACCOUNT_EXIST,
            })
        }

        const accessToken = await user.token()
        user = user._doc

        user.isApproved = true
        const data = {
            ...user,
            accessToken,
        }
        const msg = `I am signing my one-time nonce: ${user.nounce}`
        if (blockchainType == 'algorand') {
            const message = new TextEncoder().encode(msg)

            let sig = Object.values(signature)
            sig = Uint8Array.from(sig)
            const result = algosdk.verifyBytes(message, sig, address)

            if (result) {
                user.nounce = Math.floor(Math.random() * 1000000)
                await UserModal.findOneAndUpdate(
                    { _id: user._id, blockchainType },
                    { nounce: user.nounce }
                )

                return res.status(HTTP_STATUS_CODE.OK).send({
                    success: SUCCESS_STATUS.TRUE,
                    message: SUCCESS_MESSAGE.USER_AUTHENTICATED,
                    data,
                })
            }
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGNATURE_VERIFICATION_FAILED,
            })
        }

        if (blockchainType?.toLowerCase() !== 'solana') {
            const msgBuffer = ethUtil.bufferToHex(Buffer.from(msg, 'utf8'))
            const signAddress = sigUtil.recoverPersonalSignature({
                data: msgBuffer,
                sig: signature,
            })

            if (signAddress.toLowerCase() === address.toLowerCase()) {
                user.nounce = Math.floor(Math.random() * 1000000)
                //need to update
                await UserModal.findOneAndUpdate(
                    { _id: user._id, blockchainType },
                    { nounce: user.nounce }
                )

                return res.status(HTTP_STATUS_CODE.OK).send({
                    success: SUCCESS_STATUS.TRUE,
                    message: SUCCESS_MESSAGE.USER_AUTHENTICATED,
                    data: { ...user, accessToken },
                })
            }
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGNATURE_VERIFICATION_FAILED,
            })
        }

        const signatureUint8 = new Uint8Array(
            atob(signature)
                .split('')
                .map((c) => c.charCodeAt(0))
        )
        const messageUint8 = new TextEncoder().encode(msg)
        const pubKeyUint8 = base58_to_binary(address)

        const result = nacl.sign.detached.verify(
            messageUint8,
            signatureUint8,
            pubKeyUint8
        )
        if (result) {
            user.nounce = Math.floor(Math.random() * 1000000)
            //need to update
            await UserModal.findOneAndUpdate(
                { _id: user._id, blockchainType },
                { nounce: user.nounce }
            )
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.USER_AUTHENTICATED,
                data,
            })
        }

        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.SIGNATURE_VERIFICATION_FAILED,
        })
        // --snip--
    } catch (err) {
        return next(err)
    }
}

exports.signNonce = async (request, response, next) => {
    // eslint-disable-next-line no-empty
    try {
    } catch (err) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.SIGNATURE_VERIFICATION_FAILED,
        })
    }
}
