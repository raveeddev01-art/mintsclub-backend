const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const UserModal = require('../../models/users.model');
const { addImage, addContent } = require('../../utils/uploadImage');
const validation = require('../../middlewares/front/validation');
const Web3 = require('web3'); // https://www.npmjs.com/package/web3
const path = require('path');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const { mailChimp, sendGrid } = require('../../../config/vars');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const validUrl = require('valid-url');
const {
  compilingPreperations,
  createConfiguration,
  errorHandling,
  writeOutput,
  compileSources,
} = require('../../utils/contractDeployment');

mailchimp.setConfig({
  apiKey: mailChimp.apiKey,
  server: mailChimp.server,
});
const ethereumUri =
  'https://kovan.infura.io/v3/2c6740923e1d40dba2e1f4ccb9e8a413';
let web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(ethereumUri));
}

exports.create = async (req, res, next) => {
  try {
    let user = await UserModal.create(req.body);
    return res.send({ status: true, data: user });
  } catch (error) {
    return next(error);
  }
};
exports.updateProfile = async (req, res, next) => {
  try {
    let payload = {
      userId: req.body.userId,
      bio: req.body.bio,
    };

    const { error } = validation.validateUserProfile(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    if (req.body.twitterLink && !validUrl.isUri(req.body.twitterLink)) {
      return res
        .status(400)
        .send({ status: false, message: 'Enter a valid twitter Link' });
    } else {
      payload.twitterLink = req.body.twitterLink;
    }
    if (req.body.instaLink && !validUrl.isUri(req.body.instaLink)) {
      return res
        .status(400)
        .send({ status: false, message: 'Enter a valid instagram Link' });
    } else {
      payload.instaLink = req.body.instaLink;
    }

    if (req.body.webLink && !validUrl.isUri(req.body.webLink)) {
      return res
        .status(400)
        .send({ status: false, message: 'Enter a valid website Link' });
    } else {
      payload.webLink = req.body.webLink;
    }

    imagesPayload = {
      profileImage: req.body.profileImage,
      bannerImage: req.body.bannerImage,
    };

    const newPayload = { ...payload, ...imagesPayload };

    if (req.file) {
      const imgData = fs.readFileSync(req.file.path);
      newPayload.profileImage = await addImage(imgData);
    }

    if (req.files) {
      for (const key in req.files) {
        const image = req.files[key][0];
        const imgData = fs.readFileSync(image.path);
        newPayload[key] = await addImage(imgData);
      }
    }
    let user = await UserModal.findByIdAndUpdate(
      { _id: ObjectId(newPayload.userId) },
      { $set: newPayload },
      { new: true }
    );
    return res.send({
      status: true,
      user,
      message: 'User profile updated successfully.',
    });
  } catch (error) {
    return next(error);
  }
};
exports.getCreators = async (req, res, next) => {
  try {
    let users = await UserModal.aggregate([
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
    ]);
    // console.log(users,"users===>")
    return res.send({
      status: true,
      data: users,
      message: 'Authors fetched succesfully',
    });
  } catch (error) {
    return next(error);
  }
};
exports.topSellers = async (req, res, next) => {
  try {
    let { page, limit } = req.query;

    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

    total = await UserModal.countDocuments({});

    if (page > Math.ceil(total / limit) && total > 0)
      page = Math.ceil(total / limit);

    const pipeline = [
      {
        $match: {},
      },
      {
        // $project: {
        //   profileImage: 1,
        //   username: 1,
        //   address: 1,
        //   totalETH: 1,
        // },
        $sort: { totalETH: -1 },
      },
    ];
    const newTotal = await UserModal.aggregate(pipeline);

    const totalRecords = newTotal.length;

    pipeline.push({ $skip: limit * (page - 1) });
    pipeline.push({ $limit: limit });

    let users = await UserModal.aggregate(pipeline);

    return res.send({
      success: true,
      message: 'Top Sellers fetched successfully',
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
    });
  } catch (error) {
    return next(error);
  }
};
exports.getUser = async (req, res, next) => {
  try {
    let { userId } = req.params;

    let payload = { userId };

    const { error } = validation.validateUser(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    let user = await UserModal.findOne({ _id: ObjectId(payload.userId) });

    if (user) {
      return res.send({
        success: true,
        data: user,
        message: 'user fetched successfully',
      });
    }
    return res.send({
      success: false,
      message: 'User does not exist',
    });
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  //console.log(req.body, 'req.body');
  try {
    let payload = {
      name: req.body.name,
      attributes: JSON.parse(req.body.attributes),
      levels: JSON.parse(req.body.levels),
      symbol: req.body.symbol,
      externalLink: req.body.externalLink,
      email: req.body.email,
      description: req.body.description,
    };

    const { error } = validation.validateContractSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    if (req.file && req.file.filename) {
      const imgData = fs.readFileSync(req.file.path);
      payload.image = await addImage(imgData);
    }
    payload.metaData = await addContent({
      name: payload.name,
      description: payload.description,
      image: payload.image,
      properties: payload.attributes,
      nftOwnerId: payload.nftOwnerId,
      ownerAddress: payload.ownerAddress,
    });
    payload.ownerId = req.user;
    payload.creatorId = req.user;
    const { abi, bytecode, buildFile } = this.getAbi();
    payload.abi = abi;
    payload.bytecode = bytecode;
    return res.send({ status: true, data: payload });

    // const user = await UserModal.findOne({
    //   email: payload.email,
    // });
    // if (!user) {
    //   payload.count = 1;
    //   const newUser = await UserModal.create(payload);
    //   const email = await emailToOne(payload.email);
    //   const addedContact = await addContact(payload.email);
    //   return res.send({ status: true, data: payload });
    // }
    // if (user && user.count > 5) {
    //   return res.send({
    //     status: false,
    //     data: 'You have reached the maximum deployment limit',
    //   });
    // let newCount = user.count;
    // newCount++;
    // const update = await UserModal.findOneAndUpdate(
    //   { _id: mongoose.Types.ObjectId(user._id) },
    //   { $set: { count: newCount } }
    // );
    // return res.send({ status: true, data: payload });
    // }
  } catch (error) {
    return next(error);
  }
};

exports.getAbi = () => {
  const buildPath = compilingPreperations();
  const config = createConfiguration();
  const compiled = compileSources(config);
  errorHandling(compiled);
  return writeOutput(compiled, buildPath);
};

exports.deployContract = async () => {
  // Library Imports
  // console.log('i m called');
  // Connection Initialization
  // const ethereumUri = 'http://localhost:8545';

  let web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(ethereumUri));
  const address = web3.utils.toChecksumAddress(
    '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2'
  ); // user
  // if (!web3.isConnected()) {
  //   throw new Error(`unable to connect to ethereum node at ${ethereumUri}`);
  // } else {
  console.log(`connected to ehterum node at ${ethereumUri}`);
  console.log('address', address);
  // // let { coinbase } = web3.eth;
  // // console.log(`coinbase:${coinbase}`);
  // // let balance = web3.eth.getBalance(coinbase);
  // console.log(`balance:${web3.fromWei(balance, 'ether')} ETH`);
  // let { accounts } = web3.eth;
  // console.log('accunts', accounts);

  // if (web3.personal.unlockAccount(address, 'user')) {
  //   console.log(`${address} is unlocked`);
  // } else {
  //   console.log(`unlock failed, ${address}`);
  // }
  // }
  const ganacheAccounts = await web3.eth.getAccounts();
  console.log('ganacheAccounts', ganacheAccounts);
  const myWalletAddress = ganacheAccounts[0];
  /*
   * Compile Contract and Fetch ABI
   */
  // console.log('deployment', this.deploymemt());
  const { abi, bytecode, buildFile } = this.getAbi();

  // code for compile

  // console.log('compiling contract...', abi);
  /*
   * deploy contract
   */
  let gasEstimate = web3.eth.estimateGas({ data: `0x${bytecode}` });
  // console.log(`gasEstimate = ${gasEstimate}`);
  // let MyContract = web3.eth.contract(abi);
  // console.log('deploying contract...', abi);
  const deployAddr = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  const contractByteCode = `0x${bytecode}`;
  const contractAbi = abi;
  // const gasEstimate = web3.eth.estimateGas({ data: contractByteCode });
  const gasPrice = '20000000000';
  const initialSupply = 10000000000;
  const tokenName = 'LLT';
  const tokenSymbol = 'LLT';

  const privateKey =
    '6c883a6487c77ad7000670c2759bf7564eda304002d77bdf5fd1cacadd28990d';
  const contractAddress = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  web3.eth.accounts.wallet.add(privateKey);

  const byte = `0x${bytecode}`;

  // ==================== Comment out deploy code =================
  let contract = new web3.eth.Contract(abi, null, {
    data: byte,
    from: contractAddress,
    gas: 4600000,
  });

  contract
    .deploy()
    .send()
    .then((contractInstance) => {
      console.log(
        `Contract created at https://kovan.etherscan.io/address/${contractInstance.options.address}`
      );
    });
  return 1;
  // console.log(
  //   `Your contract is being deployed in transaction at http://testnet.etherscan.io/tx/${contract.transactionHash}`
  // );
  // console.log(`Your contract is being deployed in ${contract.address}`);
  // let rec = web3.eth
  //   .getTransactionReceipt(`${contract.transactionHash}`)
  //   .then(console.log('hello world'));
  // http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep

  // let myContractReturned = MyContract.new(
  //   {
  //     from: address,
  //     data: `0x${bytecode}`,
  //     gas: gasEstimate + 50000,
  //   },
  //   (err, myContract) => {
  //     if (!err) {
  //       // NOTE: The callback will fire twice!
  //       // Once the contract has the transactionHash property set and once its deployed on an address.

  //       // e.g. check tx hash on the first call (transaction send)
  //       if (!myContract.address) {
  //         console.log(
  //           `myContract.transactionHash = ${myContract.transactionHash}`
  //         ); // The hash of the transaction, which deploys the contract

  //         // check address on the second call (contract deployed)
  //       } else {
  //         console.log(`myContract.address = ${myContract.address}`); // the contract address
  //         return myContract.address;
  //         // global.contractAddress = myContract.address;
  //         // contract = myContract.address;
  //         // return contract;
  //       }
  //       // console.log('address', contract);

  //       return contract;
  //       // Note that the returned "myContractReturned" === "myContract",
  //       // so the returned "myContractReturned" object will also get the address set.
  //     }
  //     console.log(err);
  //   }
  // );
  // // (function wait() {
  // //   setTimeout(wait, 1000);
  // // })();

  // return contract;
};

exports.tester = async () => {
  const { abi, bytecode, buildFile } = this.getAbi();

  const deployAddr = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  const contractByteCode = `0x${bytecode}`;
  const contractAbi = abi;
  const gasEstimate = web3.eth.estimateGas({ data: contractByteCode });
  const gasPrice = '5000000';
  const initialSupply = 10000000000;
  const tokenName = 'LLT';
  const tokenSymbol = 'LLT';

  const privateKey =
    '6c883a6487c77ad7000670c2759bf7564eda304002d77bdf5fd1cacadd28990d';
  const contractAddress = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  web3.eth.accounts.wallet.add(privateKey);

  const byte = `0x${bytecode}`;

  // ==================== Comment out deploy code =================
  let contract = new web3.eth.Contract(abi, null, {
    data: byte,
    from: web3.eth.accounts.wallet[0].address,
    gas: 4600000,
  });
  console.log('contract', contract);
  return contract
    .deploy()
    .send({
      from: contractAddress,
      gas: gasPrice,
    })
    .then((contractInstance) => {
      console.log(
        `Contract created at https://kovan.etherscan.io/address/${contractInstance.options.address}`
      );

      const contractM = new web3.eth.Contract(
        abi,
        contractInstance.options.address
      );
      console.log('live contract methods ', contractM.methods);
      contractM.methods
        .safeMint(contractAddress, 'http:///test.com')
        .send({
          from: contractAddress,
          gas: 3000000,
        })
        .then((res) => {
          console.log(res, 'res of createNFT===>');

          // if (update) {
          //   console.log('in the update block', payload);
          //   return res.send({ status: true, data: payload });
          // }
        });
    });
  // ==============================================================
  // const myContract = new web3.eth.Contract(contractAbi, {
  //   from: deployAddr,
  //   gas: '15000000',
  //   gasPrice,
  // });
  // let bytecodeWithParam = myContract.new.getData(initialSupply, tokenName, {
  //   data: contractByteCode,
  // });
};

exports.minting = () => {
  const { abi, bytecode, buildFile } = this.getAbi();
  const deployAddr = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  const privateKey =
    '6c883a6487c77ad7000670c2759bf7564eda304002d77bdf5fd1cacadd28990d';
  const contractAddress = '0xe39f1f2151eD4153CB6bc45107d6232cf9761EE2';
  web3.eth.accounts.wallet.add(privateKey);
  const contractM = new web3.eth.Contract(
    abi,
    '0x037905e9022750be5884f5f818ecae0082d93360'
  );
  console.log('live contract methods ', contractM.methods);
  contractM.methods
    .safeMint(deployAddr, 'http:///test.com')
    .send({
      from: contractAddress,
      gas: 3000000,
    })
    .then((res) => {
      console.log(res, 'res of createNFT===>');
      // if (update) {
      //   console.log('in the update block', payload);
      //   return res.send({ status: true, data: payload });
      // }
    });
};

exports.addEmail = async (req, res, next) => {
  try {
    let newPayload = {
      email: req.body.email,
    };

    const { error } = validation.validateEmail(newPayload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    const user = await UserModal.findOne({
      email: newPayload.email,
    });
    if (!user) {
      const newUser = await UserModal.create(newPayload);
      const email = await emailToOne(newPayload.email);
      const addedContact = await addContact(newPayload.email);
      return res.send({ status: true, data: newPayload });
    }
    return res.send({ status: true, data: newPayload });
  } catch (error) {
    return next(error);
  }
};

const addContact = async (email) => {
  let listUniqueId = mailChimp.listId;

  const addListMember = async () => {
    try {
      const response = await mailchimp.lists.addListMember(listUniqueId, {
        email_address: email,
        status: 'subscribed',
        email_type: 'html',
      });
      return response;
    } catch (err) {
      return err;
    }
  };
  addListMember();
};

const emailToOne = async (email) => {
  let filePath = path.join(__dirname, `../../templates/email.html`);

  fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
    if (!err) {
      let helper = require('sendgrid').mail;
      const from_email = new helper.Email(sendGrid.senderAddress);
      const to_email = new helper.Email(email);
      const subject = 'You are all set!';
      let content = new helper.Content('text/html', data);
      const mail = new helper.Mail(from_email, subject, to_email, content);

      let sg = require('sendgrid')(sendGrid.apiKey);
      let requestBody = mail.toJSON();
      let request = sg.emptyRequest();
      request.method = 'POST';
      request.path = '/v3/mail/send';
      request.body = requestBody;
      sg.API(request, (error, response) => {
        if (!error) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        } else {
          console.log(error);
        }
      });
    } else {
      console.log(err);
    }
  });
};
