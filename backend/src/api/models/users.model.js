const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const moment = require('moment-timezone')
const jwt = require('jwt-simple')
const {
    pwdSaltRounds,
    jwtExpirationInterval,
    pwEncruptionKey,
} = require('../../config/vars')
const Approval = require('../models/approvals.model')

/**
 * User Schema
 * @private
 */
const UserSchema = new mongoose.Schema(
    {
        username: { type: String },
        email: { type: String },
        bio: { type: String },
        isApproved: { type: Boolean },
        profileImage: { type: String },
        bannerImage: { type: String },
        address: { type: String },
        twitterLink: { type: String },
        instaLink: { type: String },
        webLink: { type: String },
        totalETH: { type: Number },
        nounce: {
            type: Number,
            defaultValue: () => Math.floor(Math.random() * 1000000),
        },
        blockchainType: { type: String, required: true },
    },
    { timestamps: true }
)

UserSchema.methods.verifyPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
}

/**
 * Methods
 */
UserSchema.method({
    transform() {
        const transformed = {}
        const fields = ['_id', 'email', 'address', 'username', 'nounce']
        fields.forEach((field) => {
            transformed[field] = this[field]
        })
        return transformed
    },

    token() {
        const playload = {
            exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
            iat: moment().unix(),
            sub: this._id,
        }
        return jwt.encode(playload, pwEncruptionKey)
    },
    async passwordMatches(password) {
        return bcrypt.compare(password, this.password)
    },
})

UserSchema.pre('save', async function save(next) {
    try {
        if (!this.isModified('password')) return next()
        const rounds = pwdSaltRounds ? parseInt(pwdSaltRounds) : 10
        const hash = await bcrypt.hash(this.password, rounds)
        this.password = hash
        return next()
    } catch (error) {
        return next(error)
    }
})

UserSchema.post('save', async function (next) {
    try {
        const approvalPayload = {
            userId: this?._id,
            isApproved: false,
        }

        await Approval.create(approvalPayload)
    } catch (error) {
        console.log('error', error)
        // next(error)
    }
})

/**
 * @typedef User
 */

module.exports = mongoose.model('User', UserSchema)
