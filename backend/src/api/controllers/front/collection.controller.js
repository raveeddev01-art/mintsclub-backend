const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const NFT = require('../../models/nfts.model');
const Collection = require('../../models/collection.model');
const Categories = require('../../models/categories.model');
const User = require('../../models/users.model');

const { addImage } = require('../../utils/uploadImage');
const { checkDuplicate } = require('../../../config/errors');
const { collectionDefaultImage } = require('../../../config/vars');
const validation = require('../../middlewares/front/collectionValidation');

// API to create collection
exports.create = async (req, res, next) => {
  try {
    let payload = {
      userId: req.body.userId,
      categoryId: req.body.categoryId,
      name: req.body.name,
      url: req.body.url,
      description: req.body.description,
      //category: req.body.category,
    };

    const { error } = validation.validateCollectionSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ success: false, message: errorMsg });
    }

    let imagesPayload = {
      logo: req.body.logo,
      featuredImg: req.body.featuredImgUrl,
      banner: req.body.bannerUrl,
    };

    const newPayload = { ...payload, ...imagesPayload };

    newPayload.categoryId = null;
    if (payload.categoryId) {
      newPayload.categoryId = payload.categoryId;
    }

    if (req.files)
      for (const key in req.files) {
        const image = req.files[key][0];
        const imgData = fs.readFileSync(image.path);
        newPayload[key] = await addImage(imgData);
      }

    if (!newPayload.logo) {
      return res.status(400).send({
        success: false,
        message: 'logo image is required',
      });
    }

    const existingCollection = await Collection.findOne({
      name: new RegExp(newPayload.name, 'gi'),
      userId: newPayload.userId,
    });

    if (existingCollection) {
      return res.status(400).send({
        success: false,
        message: 'Collection with same name already exists',
      });
    }

    const collection = await Collection.create(newPayload);
    return res.status(201).send({
      success: true,
      message: 'Collection created successfully',
      collection,
    });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001)
      checkDuplicate(error, res, 'Collection');
    else return next(error);
  }
};

// API to edit collection
exports.edit = async (req, res, next) => {
  try {
    let payload = {
      userId: req.body.userId,
      _id: req.body._id,
      categoryId: req.body.categoryId,
      name: req.body.name,
      url: req.body.url,
      description: req.body.description,
    };

    const { error } = validation.validateEditCollectionSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ success: false, message: errorMsg });
    }
    let imagesPayload = {
      logo: req.body.logo,
      featuredImg: req.body.featuredImgUrl,
      banner: req.body.bannerUrl,
    };

    const newPayload = { ...payload, ...imagesPayload };

    newPayload.categoryId = null;
    if (payload.categoryId) {
      newPayload.categoryId = payload.categoryId;
    }

    if (req.files)
      for (const key in req.files) {
        const image = req.files[key][0];
        const imgData = fs.readFileSync(image.path);
        newPayload[key] = await addImage(imgData);
      }

    if (!newPayload.logo) {
      return res.status(400).send({
        success: false,
        message: 'logo image is required',
      });
    }

    if (newPayload.name) {
      const existingCollection = await Collection.findOne({
        _id: { $ne: newPayload._id },
        name: new RegExp(newPayload.name, 'gi'),
        userId: newPayload.userId,
      });
      if (existingCollection)
        return res.status(400).send({
          success: false,
          message: 'Collection with same name already exists',
        });
    }

    const collection = await Collection.findByIdAndUpdate(
      { _id: newPayload._id },
      { $set: newPayload },
      { new: true }
    );
    return res.send({
      success: true,
      message: 'Collection updated successfully',
      collection,
    });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001)
      checkDuplicate(error, res, 'Collection');
    else return next(error);
  }
};

// API to delete collection
exports.delete = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (collectionId) {
      const collection = await Collection.deleteOne({ _id: collectionId });
      if (collection.deletedCount)
        return res.send({
          success: true,
          message: 'Collection deleted successfully',
          collectionId,
        });
      else
        return res.status(400).send({
          success: false,
          message: 'Collection not found for given Id',
        });
    } else
      return res
        .status(400)
        .send({ success: false, message: 'Collection Id is required' });
  } catch (error) {
    return next(error);
  }
};

// API to get collection
exports.get = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (collectionId) {
      let collection = await Collection.findOne({ _id: collectionId })
        .populate([
          { path: 'userId', select: '_id username email profilePhoto' },
          { path: 'categoryId', select: '_id name image' },
        ])
        .lean(true);
      if (collection) {
        collection.user = collection.userId;
        collection.category = collection.categoryId;

        delete collection.userId;
        delete collection.categoryId;

        collection.items = await NFT.countDocuments({ collectionId });

        let owners = await NFT.find({ collectionId }).distinct('collectionId');
        collection.owners = owners?.length || 0;

        return res.json({
          success: true,
          message: 'Collection retrieved successfully',
          collection,
        });
      } else
        return res.status(400).send({
          success: false,
          message: 'Collection not found for given Id',
        });
    } else
      return res
        .status(400)
        .send({ success: false, message: 'Collection Id is required' });
  } catch (error) {
    return next(error);
  }
};

// API to get collection list
exports.list = async (req, res, next) => {
  try {
    let { page, limit, myFilter, all } = req.query;

    let filter = {};

    if (myFilter) {
      const applyFilter = await Categories.findOne({}, '_id').where(
        'description',
        myFilter
      );
      if (!applyFilter) {
        return res.status(400).send({
          success: false,
          message: 'Invalid Filter passed',
        });
      }
      filter = { categoryId: applyFilter._id };
    }

    if (myFilter && myFilter == 'all') {
      filter = {};
    }

    let total = 0;

    if (!all) {
      page = page !== undefined && page !== '' ? parseInt(page) : 1;
      limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

      total = await Collection.countDocuments({});

      if (page > Math.ceil(total / limit) && total > 0)
        page = Math.ceil(total / limit);
    }

    const pipeline = [
      {
        $match: filter,
      },
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'nfts',
          foreignField: '_id',
          localField: 'nft',
          as: 'nfts',
        },
      },
      {
        $unwind: {
          path: '$nfts',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$_id',
          nftDetail: {
            $push: { image: '$nfts.image', fileType: '$nfts.fileType' },
          },
          userId: { $first: '$userId' },
          categoryId: { $first: '$categoryId' },
          name: { $first: '$name' },
          description: { $first: '$description' },
          logo: { $first: '$logo' },
          featuredImg: { $first: '$featuredImg' },
          banner: { $first: '$banner' },
          username: { $first: '$user.username' },
          profileImage: { $first: '$user.profileImage' },
        },
      },
    ];

    const newTotal = await Collection.aggregate(pipeline);

    const totalRecords = newTotal.length;

    if (!all) {
      pipeline.push({ $skip: limit * (page - 1) });
      pipeline.push({ $limit: limit });
    }

    const collections = await Collection.aggregate(pipeline);
    // for (const collection of collections) {
    //   collection.NFTCount = collection.nftsList
    //     ? collection.nftsList.length
    //     : '0';
    // }

    return res.send({
      success: true,
      message: 'Collections fetched successfully',
      data: {
        collections: collections,

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

// API to get my collections list
exports.myCollectionList = async (req, res, next) => {
  try {
    let { userId, page, limit } = req.query;

    if (!userId)
      return res
        .status(400)
        .send({ success: false, message: 'Please Sign In First' });

    const findUser = await User.findOne({ _id: userId });

    if (findUser) {
      let total = 0;

      page = page !== undefined && page !== '' ? parseInt(page) : 1;
      limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

      total = await Collection.find({}).where('userId', userId);

      if (page > Math.ceil(total / limit) && total > 0)
        page = Math.ceil(total / limit);

      const pipeline = [
        {
          $match: { userId: ObjectId(userId) },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $lookup: {
            from: 'nfts',
            foreignField: '_id',
            localField: 'nft',
            as: 'nfts',
          },
        },
        {
          $unwind: {
            path: '$nfts',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$_id',
            nftDetail: {
              $push: { image: '$nfts.image', fileType: '$nfts.fileType' },
            },
            userId: { $first: '$userId' },
            categoryId: { $first: '$categoryId' },
            name: { $first: '$name' },
            description: { $first: '$description' },
            logo: { $first: '$logo' },
            featuredImg: { $first: '$featuredImg' },
            banner: { $first: '$banner' },
            username: { $first: '$user.username' },
            profileImage: { $first: '$user.profileImage' },
          },
        },
      ];

      const newTotal = await Collection.aggregate(pipeline);

      const totalRecords = newTotal.length;

      pipeline.push({ $skip: limit * (page - 1) });
      pipeline.push({ $limit: limit });

      const Collections = await Collection.aggregate(pipeline);

      return res.status(200).send({
        success: true,
        message: 'My collections fetched successfully',
        data: {
          collections: { totalRecords: totalRecords, Collections: Collections },
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
    }
    return res.status(200).send({
      success: false,
      message: 'UserId not found',
    });
  } catch (error) {
    return next(error);
  }
};

exports.popular = async (req, res, next) => {
  try {
    let { page, limit, myFilter } = req.query;

    let filter = {};

    if (myFilter) {
      const applyFilter = await Categories.findOne({}, '_id').where(
        'description',
        myFilter
      );
      if (!applyFilter) {
        return res.status(400).send({
          success: false,
          message: 'Invalid Filter passed',
        });
      }

      filter = { categoryId: applyFilter._id };
    }

    if (myFilter && myFilter == 'all') {
      filter = {};
    }

    let total = 0;

    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

    total = await Collection.countDocuments({});

    if (page > Math.ceil(total / limit) && total > 0)
      page = Math.ceil(total / limit);

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'likesschemas',
          foreignField: 'nftId',
          localField: 'nft',
          as: 'likesschemas',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'nfts',
          foreignField: '_id',
          localField: 'nft',
          as: 'nft',
        },
      },
      {
        $unwind: {
          path: '$nft',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$_id',
          likesCount: { $first: '$likesschemas.count' },
          nfts: {
            $push: { image: '$nft.image', fileType: '$nft.fileType' },
          },
          userId: { $first: '$userId' },
          categoryId: { $first: '$categoryId' },
          name: { $first: '$name' },
          description: { $first: '$description' },
          logo: { $first: '$logo' },
          featuredImg: { $first: '$featuredImg' },
          banner: { $first: '$banner' },
          soldCopies: {
            $push: {
              $subtract: ['$nft.copies', '$nft.remainingCopies'],
            },
          },
          username: { $first: '$user.username' },
          profileImage: { $first: '$user.profileImage' },
        },
      },
    ];

    const newTotal = await Collection.aggregate(pipeline);

    const totalRecords = newTotal.length;

    pipeline.push({ $skip: limit * (page - 1) });
    pipeline.push({ $limit: limit });

    const collectionsList = await Collection.aggregate(pipeline);

    return res.status(200).send({
      success: true,
      message: 'popular collection fetched successfully',
      data: {
        collectionsList: collectionsList,
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
