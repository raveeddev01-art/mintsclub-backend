const jwt = require('jsonwebtoken')
const {
  ERROR_MESSAGE,
  SUCCESS_MESSAGE,
  SUCCESS_STATUS,
  HTTP_STATUS_CODE,
} = require('../../../config/constants')
const adminAuth =async  (req, res, next) => {
    const token = req.header('x-auth-token')

    try {
      if (!token) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.UNAUTHORIZED,
        })        
    }
        //   Verify Token
        const decoded = await  jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role === 'admin') {
            req.user = decoded
            return next()
        }
        // return res.status(401).json('Authorization denied!')
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).send({
            success: SUCCESS_STATUS.FALSE,
            message:'Authorization denied!' ,
    }) }
    catch (e) {
        return next(e.message)
    }
}
module.exports = {
    adminAuth,
}
