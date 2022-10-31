const User = require('../../models/users.model')
// const validation = require('../../middlewares/front/validation')
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
exports.register = async (req, res, next) => {
    try {
        const payload = {
            address: req.body.address,
            username: req.body.username,
            email: req.body.email,
            isApproved: req.body.isApproved,
        }

        const email = payload.email.toLowerCase()
        const address = payload.address
        const username = payload.username
        // eslint-disable-next-line no-unused-vars
        const profileImage = null
        const isApproved = payload.isApproved
        const totalETH = 0

        let user = await User.findOne({ address })
        if (user) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.WALLET_EXIST,
            })
        }

        user = await User.create({
            address,
            username,
            email,
            totalETH,
            isApproved,
        })

        const accessToken = await user.token()
        user = user.transform()
        let data = {
            ...user,
            accessToken,
        }

        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.USER_REGISTERED,
            data,
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Returns jwt token if valid address and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
    try {
        const payload = {
            address: req.body.address,
        }
        const address = payload.address
        let user = await User.findOne({ address })
        if (!user) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NO_ACCOUNT_EXIST,
            })
        }
        const accessToken = await user.token()
        user = user.transform()
        const data = {
            ...user,
            accessToken,
        }
        return res.status(200).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.USER_LOGGEDIN,
            data,
        })
    } catch (error) {
        return next(error)
    }
}
