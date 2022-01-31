const User = require('../../models/users.model');
const validation = require('../../middlewares/front/validation');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

exports.register = async (req, res, next) => {
  try {
    let payload = {
      address: req.body.address,
      username: req.body.username,
      email: req.body.email,
    };

    const { error } = validation.validateSignUpSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    const email = payload.email.toLowerCase();
    const address = payload.address;
    const username = payload.username;

    let user = await User.findOne({ address });
    if (user) {
      return res
        .status(200)
        .send({ status: false, message: 'Wallet already exists' });
    }

    user = await User.create({ address, username, email });

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
  try {
    let { address, sign } = req.body;
    if (!address) {
      return res
        .status(400)
        .send({ status: false, data: 'address is required' });
    }
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

    // passport.use(
    //   new localStrategy(
    //     { usernameField: 'address' },
    //     async (username, password, done) => {
    //       let user = await User.findOne(
    //         { address: username },
    //         'address email password'
    //       );
    //       if (!user) {
    //         return done(null, false, {
    //           status: false,
    //           message:
    //             'There is no account linked to that address, Please signup first',
    //           notExist: 1,
    //         });
    //       } else if (!user.verifyPassword(password)) {
    //         return done(null, false, {
    //           status: false,
    //           message: 'Incorrect Password 123',
    //         });
    //       }
    //       return done(null, user);
    //     }
    //   )
    // );

    // passport.authenticate('local', async (err, user, info) => {
    //   if (err)
    //     return res.status(200).send({
    //       err,
    //       status: false,
    //       message: 'Oops! Something went wrong while authenticating',
    //     });
    //   //else if (user) {
    //   //{
    //   var accessToken = await user.token();
    //   user = user.transform();
    //   let data = {
    //     ...user,
    //     accessToken,
    //   };
    //   // delete data.password;

    //   return res.status(200).send({
    //     status: true,
    //     message: 'User logged in successfully',
    //     data,
    //   });
    //   //   }
    //   // } else
    //   //   return res
    //   //     .status(200)
    //   //     .send({ status: false, message: 'Incorrect Password234' });
    // })(req, res);
  } catch (error) {
    return next(error);
  }
};
