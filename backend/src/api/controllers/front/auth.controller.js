const User = require('../../models/users.model');
const validation = require('../../middlewares/front/validation');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const Approval = require('../../models/approvals.model');

exports.register = async (req, res, next) => {
  try {
    let payload = {
      address: req.body.address,
      username: req.body.username,
      email: req.body.email,
      isApproved: req.body.isApproved,
    };

    const { error } = validation.validateSignUpSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    const email = payload.email.toLowerCase();
    const address = payload.address;
    const username = payload.username;
    const profileImage = null;
    const isApproved = payload.isApproved;
    const totalETH = 0;

    let user = await User.findOne({ address });
    if (user) {
      return res
        .status(200)
        .send({ status: false, message: 'Wallet already exists' });
    }

    user = await User.create({
      address,
      username,
      email,
      totalETH,
      isApproved,
    });

    let approvalPayload = {
      userId: user._id,
      isApproved: false,
    };

    await Approval.create(approvalPayload);

    var accessToken = await user.token();
    user = user.transform();
    let data = {
      ...user,
      accessToken,
    };

    return res.status(200).send({
      status: true,
      message: 'User registered successfully',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns jwt token if valid address and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  console.log(req.body, 'req.body login==>');
  try {
    let payload = {
      address: req.body.address,
    };

    const { error } = validation.validateAddress(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    const address = payload.address;
    let user = await User.findOne({ address });
    if (!user) {
      return res.status(200).send({
        status: false,
        message:
          'There is no account linked to that address, Please signup first',
        notExist: 1,
      });
    }
    var accessToken = await user.token();
    user = user.transform();
    let data = {
      ...user,
      accessToken,
    };
    return res.status(200).send({
      status: true,
      message: 'User logged in successfully',
      data,
    });
  } catch (error) {
    return next(error);
  }
};
