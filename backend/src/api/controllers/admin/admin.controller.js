/* eslint-disable no-unused-vars */
const fs = require('fs')
const mongoose = require('mongoose')
const Admin = require('../../models/admin.model')
const { addImage } = require('../../utils/upload')
const { checkDuplicate } = require('../../../config/errors')
const { sendEmail } = require('../../utils/emails/emails')
const { adminUrl } = require('../../../config/vars')
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const jwt = require('jsonwebtoken')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const createToken = (adminDetails, secretKey, next) => {
    return jwt.sign(adminDetails, secretKey)
    next()
}

// API to login admin
exports.login = async (req, res, next) => {
    try {
        let { email, password } = req.body

        email = email.toLowerCase()
        const user = await Admin.findOne({ email }).lean()
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.USER_NOT_FOUND,
            })
        } else {
            const cmp = await bcrypt.compare(req.body.password, user.password)
            if (!cmp) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: ERROR_MESSAGE.PASSWORD_INCORRECT,
                })
            }
            if (!user.status)
                return res.status(403).send({
                    success: false,
                    message:
                        'Your account is not Approved, kindly contact admin',
                    user,
                })
            const token = createToken(
                { _id: Admin._id, role: 'admin' },
                process.env.JWT_SECRET
            )
            return res.status(200).send({ token, user: user })
        }
    } catch (error) {
        return res.status(404).json(error.message)
    }
}

// API to create admin
exports.create = async (req, res, next) => {
    try {
        let payload = req.body
        if (req.files && req.files.image) {
            const image = req.files.image[0]
            const imgData = fs.readFileSync(image.path)
            payload.image = await addImage(imgData)
        }
        const { status, roleId, resetCode, ...otherAttributes } = payload
        const admin = new Admin(otherAttributes)
        await admin.save()
        return res.send({
            success: true,
            message: 'Admin user created successfully',
            admin,
        })
    } catch (error) {
        if (error.code === 11000 || error.code === 11001)
            checkDuplicate(error, res, 'Admin')
        else return next(error)
    }
}

// API to edit admin
exports.edit = async (req, res, next) => {
    try {
        let payload = req.body
        if (req.files && req.files.image) {
            const image = req.files.image[0]
            const imgData = fs.readFileSync(image.path)
            payload.image = await addImage(imgData)
        }

        const admin = await Admin.findByIdAndUpdate(
            { _id: mongoose.Types.ObjectId(payload._id) },
            { $set: payload },
            { new: true }
        )
        return res.send({
            success: true,
            message: 'Admin updated successfully',
            admin,
        })
    } catch (error) {
        if (error.code === 11000 || error.code === 11001)
            checkDuplicate(error, res, 'Admin')
        else return next(error)
    }
}

// API to delete admin
exports.delete = async (req, res, next) => {
    try {
        const { adminId } = req.params
        if (adminId) {
            const admin = await Admin.deleteOne({ _id: adminId })
            if (admin.deletedCount)
                return res.send({
                    success: true,
                    message: 'Admin deleted successfully',
                    adminId,
                })
            else
                return res.status(400).send({
                    success: false,
                    message: 'Admin not found for given Id',
                })
        } else
            return res
                .status(400)
                .send({ success: false, message: 'Admin Id is required' })
    } catch (error) {
        return next(error)
    }
}

// API to get an admin
exports.get = async (req, res, next) => {
    try {
        const { adminId } = req.params
        if (adminId) {
            const admin = await Admin.findOne(
                { _id: adminId },
                { __v: 0, createdAt: 0, updatedAt: 0, password: 0 }
            ).lean(true)
            if (admin)
                return res.json({
                    success: true,
                    message: 'Admin retrieved successfully',
                    admin,
                })
            else
                return res.status(400).send({
                    success: false,
                    message: 'Admin not found for given Id',
                })
        } else
            return res
                .status(400)
                .send({ success: false, message: 'Admin Id is required' })
    } catch (error) {
        return next(error)
    }
}

// API to get admin list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = await Admin.countDocuments({})

        const admins = await Admin.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
        ])

        return res.send({
            success: true,
            message: 'Admins fetched successfully',
            data: {
                admins,
                pagination: {
                    page,
                    limit,
                    total,
                    pages:
                        Math.ceil(total / limit) <= 0
                            ? 1
                            : Math.ceil(total / limit),
                },
            },
        })
    } catch (error) {
        return next(error)
    }
}

// API to edit admin password
exports.editPassword = async (req, res, next) => {
    try {
        let payload = req.body
        let admin = await Admin.find({
            _id: mongoose.Types.ObjectId(payload._id),
        })
        if (admin[0].verifyPassword(payload.current)) {
            let newPayload = {
                password: await admin[0].getPasswordHash(payload.new),
            }
            let updatedAdmin = await Admin.findByIdAndUpdate(
                { _id: mongoose.Types.ObjectId(payload._id) },
                { $set: newPayload },
                { new: true }
            )
            return res.send({
                success: true,
                message: 'Password updated successfully',
                updatedAdmin,
            })
        } else {
            return res.send({
                success: false,
                message: 'Incorrent current password',
                admin: admin[0],
            })
        }
    } catch (error) {
        if (error.code === 11000 || error.code === 11001)
            checkDuplicate(error, res, 'Admin')
        else return next(error)
    }
}

// API to edit admin password
exports.forgotPassword = async (req, res, next) => {
    try {
        let payload = req.body
        let admin = await Admin.find({ email: payload.email })
        if (admin.length) {
            let randString = randomstring.generate({
                length: 8,
                charset: 'alphanumeric',
            })
            await Admin.findByIdAndUpdate(
                { _id: mongoose.Types.ObjectId(admin[0]._id) },
                { $set: { resetCode: randString } },
                { new: true }
            )

            let content = {
                '${url}': `${adminUrl}admin/reset-password/${admin[0]._id}/${randString}`,
            }

            await sendEmail(payload.email, 'forgot-password', content)
            return res.send({
                success: true,
                message:
                    'An email has been sent to your account in case an account with this email exists. Please check your email and follow the instruction in it to reset your password.',
            })
        } else {
            return res.send({
                success: true,
                message:
                    'An email has been sent to your account in case an account with this email exists. Please check your email and follow the instruction in it to reset your password.',
            })
        }
    } catch (error) {
        return next(error)
    }
}

// API to reset password
exports.resetPassword = async (req, res, next) => {
    try {
        let payload = req.body
        let admin = await Admin.find({
            _id: mongoose.Types.ObjectId(payload._id),
        })
        if (admin.length) {
            if (admin[0].resetCode === payload.code) {
                let newPayload = {
                    password: await admin[0].getPasswordHash(payload.new),
                    resetCode: '',
                }
                let updatedAdmin = await Admin.findByIdAndUpdate(
                    { _id: mongoose.Types.ObjectId(payload._id) },
                    { $set: newPayload },
                    { new: true }
                )
                return res.send({
                    success: true,
                    message: 'Password reset successfully',
                    updatedAdmin,
                })
            } else {
                return res.send({
                    success: false,
                    message:
                        'Session expired, try again with other email link.',
                })
            }
        } else {
            return res.send({ success: false, message: 'Incorrent Admin Id' })
        }
    } catch (error) {
        if (error.code === 11000 || error.code === 11001)
            checkDuplicate(error, res, 'Admin')
        else return next(error)
    }
}
