/* eslint-disable no-unused-vars */
const fs = require('fs')
const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const Admin = require('../../models/admin.model')
const { addImage } = require('../../utils/upload')
const { checkDuplicate } = require('../../../config/errors')
const { sendEmail } = require('../../utils/emails/emails')
const { adminUrl } = require('../../../config/vars')
const randomstring = require('randomstring')

// API to login admin
exports.login = async (req, res, next) => {
    try {
        let { email, password } = req.body

        email = email.toLowerCase()
        const user = await Admin.findOne({ email }).lean()

        if (!user)
            return res.status(404).send({
                success: false,
                message: 'Incorrect email or password',
            })

        passport.use(
            new localStrategy(
                { usernameField: 'email' },
                (username, password, done) => {
                    Admin.findOne(
                        { email: username },
                        'name email phone address roleId status image password',
                        (err, user) => {
                            if (err) return done(err)
                            else if (!user)
                                // unregistered email
                                return done(null, false, {
                                    success: false,
                                    message: 'Incorrect email or password',
                                })
                            else if (!user.verifyPassword(password))
                                // wrong password
                                return done(null, false, {
                                    success: false,
                                    message: 'Incorrect email or password',
                                })
                            else return done(null, user)
                        }
                    )
                }
            )
        )

        // call for passport authentication
        passport.authenticate('local', async (err, user, info) => {
            if (err)
                return res.status(400).send({
                    err,
                    success: false,
                    message: 'Oops! Something went wrong while authenticating',
                })
            // registered user
            else if (user) {
                if (!user.status)
                    return res.status(403).send({
                        success: false,
                        message:
                            'Your account is inactive, kindly contact admin',
                        user,
                    })
                else {
                    let accessToken = await user.token()
                    let data = {
                        ...user._doc,
                        accessToken,
                    }
                    await Admin.updateOne(
                        { _id: user._id },
                        { $set: { accessToken } },
                        { upsert: true }
                    )
                    
                    return res.status(200).send({
                        success: true,
                        message: 'Admin logged in successfully',
                        data,
                    })
                }
            }
            // unknown user or wrong password
            else
                return res.status(402).send({
                    success: false,
                    message: 'Incorrect email or password',
                })
        })(req, res)
    } catch (error) {
        return next(error)
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

        const admin = new Admin(payload)
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
