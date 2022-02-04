const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const NFT = require('../../models/nfts.model');
const Collection = require('../../models/collection.model');
const Categories = require('../../models/categories.model');

const { addImage } = require('../../utils/upload');
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
      category: req.body.category,
    };
    const { error } = validation.validateCollectionSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    imagesPayload = {
      logo: req.body.logo,
      featuredImg: req.body.featuredImgUrl,
      banner: req.body.bannerUrl,
    };

    const newPayload = { ...payload, ...imagesPayload };

    const List = await Categories.find({}, 'description').where(
      'status',
      'true'
    );

    allNames = [];
    categoryNames = List.map((value) => {
      allNames.push(value.description);
      return allNames;
    });

    if (newPayload.category && !allNames.includes(newPayload.category)) {
      return res.status(400).send({
        status: false,
        message: 'Please provide valid category',
      });
    }
    categoryId = await Categories.findOne({}, '_id').where(
      'description',
      newPayload.category
    );

    newPayload.categoryId = categoryId._id;

    if (req.files)
      // console.log(payload,"payload")
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
    // check user existing collection
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
    return res.status(200).send({
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
      category: req.body.category,
    };

    const { error } = validation.validateEditCollectionSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    imagesPayload = {
      logo: req.body.logo,
      featuredImg: req.body.featuredImgUrl,
      banner: req.body.bannerUrl,
    };

    const newPayload = { ...payload, ...imagesPayload };

    const List = await Categories.find({}, 'description').where(
      'status',
      'true'
    );

    allNames = [];
    categoryNames = List.map((value) => {
      allNames.push(value.description);
      return allNames;
    });

    if (newPayload.category && !allNames.includes(newPayload.category)) {
      return res.status(400).send({
        status: false,
        message: 'Please provide valid category',
      });
    }
    categoryId = await Categories.findOne({}, '_id').where(
      'description',
      newPayload.category
    );

    newPayload.categoryId = categoryId._id;

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
    // TEMP appending userId
    // payload.userId = '61408000cef27850fdea272b'

    // if name is given then check user existing collection

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
      let collection = await Collection.findOne(
        { _id: collectionId },
        { __v: 0, createdAt: 0, updatedAt: 0 }
      )
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
    let { page, limit, myFilter, all, userId } = req.query;
    // let userId = req.user
    // if (!userId)
    //     return res.status(400).send({ success: false, message: 'Please Sign In First' })
    // console.log('filter', req.body.myFilter);
    let filter = {};
    if (req.query.myFilter) {
      const applyFilter = await Categories.findOne({}, '_id').where(
        'description',
        req.query.myFilter
      );
      if (!applyFilter) {
        return res.status(400).send({
          status: false,
          message: 'Invalid Filter passed',
        });
      }
      filter = { categoryId: applyFilter._id };
    }
    let total = 0;

    if (!all) {
      page = page !== undefined && page !== '' ? parseInt(page) : 1;
      limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

      total = await Collection.countDocuments({});

      if (total == 0) {
        return res.status(400).send({
          status: false,
          message: 'No Collections Found',
        });
      }
      if (page > Math.ceil(total / limit) && total > 0)
        page = Math.ceil(total / limit);
    }

    const pipeline = [
      {
        $match: filter,
        //$match: { categoryId: ObjectId('616d7fe8fea5e26fe01de584') },
      },
      { $sort: { name: 1 } },
      // {
      //   $lookup: {
      //     from: 'categories',
      //     foreignField: '_id',
      //     localField: 'categoryId',
      //     as: 'category',
      //   },
      // },
      // {
      //   $unwind: '$category',
      // },
      //{
      // $project: {
      //   _id: 1,
      //   name: 1,
      //   logo: 1,
      //   userId: 1,
      //   featuredImg: { $ifNull: ['$featuredImg', collectionDefaultImage] },
      // category: {
      //   _id: '$category._id',
      //   name: '$category.name',
      // },
      // },
      //},
    ];
    const newTotal = await Collection.aggregate(pipeline);

    const totalRecords = newTotal.length;
    if (!all) {
      pipeline.push({ $skip: limit * (page - 1) });
      pipeline.push({ $limit: limit });
    }
    const collections = await Collection.aggregate(pipeline);

    return res.send({
      success: true,
      message: 'Collections fetched successfully',
      data: {
        collections: collections.length ? collections : null,

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
exports.all = async (req, res, next) => {
  try {
    let { page, limit, categoryId, all, userId } = req.query;
    // console.log(userId,"userId===>")
    // let userId = req.user
    // console.log("userId------@", userId);
    // console.log("category------@", req.categoryId)
    // if (!userId)
    //     return res.status(400).send({ success: false, message: 'Please Sign In First' })

    const filter = {};

    // if (userId)
    //     filter.userId = ObjectId(userId)

    if (categoryId) filter.categoryId = ObjectId(categoryId);

    let total = 0;

    // if (!all) {
    //     page = page !== undefined && page !== '' ? parseInt(page) : 1
    //     limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

    //     total = await Collection.countDocuments(filter)

    //     if (page > Math.ceil(total / limit) && total > 0)
    //         page = Math.ceil(total / limit)

    // }

    const pipeline = [
      {
        $match: filter,
      },
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: 'categories',
          foreignField: '_id',
          localField: 'categoryId',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 1,
          name: 1,
          logo: 1,
          userId: 1,
          featuredImg: { $ifNull: ['$featuredImg', collectionDefaultImage] },
          category: {
            _id: '$category._id',
            name: '$category.name',
          },
        },
      },
    ];

    // if (!all) {
    //     pipeline.push({ $skip: limit * (page - 1) })
    //     pipeline.push({ $limit: limit })
    // }

    const collections = await Collection.aggregate(pipeline);
    // console.log("collections.....@@@", collections);

    return res.send({
      success: true,
      message: 'Collections fetched successfully',
      data: {
        collections: collections.length ? collections : null,
        // pagination: {
        //     page, limit, total,
        //     pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit)
        // }
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getChatPagination = async (req, res) => {
  const CHAT_PER_PAGE = 5;
  let originalChats = await Chat.getUserChatByRole(req.user);
  const baseUrl = req.protocol + '://' + req.get('host');

  if (
    originalChats.length >= req.params.pageNumber * CHAT_PER_PAGE &&
    req.params.pageNumber > 0
  ) {
    let chats = originalChats.slice(
      (req.params.pageNumber - 1) * CHAT_PER_PAGE,
      req.params.pageNumber * CHAT_PER_PAGE
    );
    return res.status(SUCCESS_CODE).json({
      data: {
        chats,
        hasNext: originalChats.length > req.params.pageNumber * CHAT_PER_PAGE,
        nextPage:
          originalChats.length > req.params.pageNumber * CHAT_PER_PAGE
            ? `${baseUrl}/api/v1/chat/${parseInt(req.params.pageNumber) + 1}`
            : null,
      },
    });
  } else if (
    (req.params.pageNumber - 1) * CHAT_PER_PAGE <= originalChats.length &&
    req.params.pageNumber > 0
  ) {
    chats = originalChats.slice(
      (req.params.pageNumber - 1) * CHAT_PER_PAGE,
      originalChats.length
    );
    return res.status(SUCCESS_CODE).json({
      data: {
        chats,
        hasNext: originalChats.length > req.params.pageNumber * CHAT_PER_PAGE,
        nextPage:
          originalChats.length > req.params.pageNumber * CHAT_PER_PAGE
            ? `${baseUrl}/api/v1/chat/${parseInt(req.params.pageNumber) + 1}`
            : null,
      },
    });
  } else {
    return res.status(SUCCESS_CODE).json({
      data: {
        chats: [],
      },
    });
  }
};
