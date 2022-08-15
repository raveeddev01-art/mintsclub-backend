const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const Category = require("../../models/categories.model");
const { addImage } = require("../../utils/upload");
const { checkDuplicate } = require("../../../config/errors");

// API to create category
exports.create = async (req, res, next) => {
  try {
    let payload = req.body;
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    const category = await Category.create(payload);
    return res.send({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001)
      checkDuplicate(error, res, "Category");
    else return next(error);
  }
};

// API to edit category
exports.edit = async (req, res, next) => {
  try {
    let payload = req.body;
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    const category = await Category.findByIdAndUpdate(
      { _id: payload._id },
      { $set: payload },
      { new: true }
    );
    return res.send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    if (error.code === 11000 || error.code === 11001)
      checkDuplicate(error, res, "Category");
    else return next(error);
  }
};

// API to delete category
exports.delete = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (categoryId) {
      const category = await Category.deleteOne({ _id: categoryId });
      if (category && category.deletedCount)
        return res.send({
          success: true,
          message: "Category deleted successfully",
          categoryId,
        });
      else
        return res
          .status(400)
          .send({ success: false, message: "Category not found for given Id" });
    } else
      return res
        .status(400)
        .send({ success: false, message: "Category Id is required" });
  } catch (error) {
    return next(error);
  }
};

// API to get a category
exports.get = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (categoryId) {
      const category = await Category.findOne(
        { _id: categoryId },
        { _id: 1, name: 1, image: 1, status: 1, description: 1 }
      ).lean(true);
      if (category)
        return res.json({
          success: true,
          message: "Category retrieved successfully",
          category,
        });
      else
        return res
          .status(400)
          .send({ success: false, message: "Category not found for given Id" });
    } else
      return res
        .status(400)
        .send({ success: false, message: "Category Id is required" });
  } catch (error) {
    return next(error);
  }
};

// API to get categories list
exports.list = async (req, res, next) => {
  try {
    let { page, limit } = req.query;

    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== "" ? parseInt(limit) : 10;

    const total = await Category.countDocuments({});

    if (page > Math.ceil(total / limit) && total > 0)
      page = Math.ceil(total / limit);

    const categories = await Category.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: limit * (page - 1) },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          status: 1,
          createdAt: 1,
          description: 1,
        },
      },
    ]);

    return res.send({
      success: true,
      message: "Categories fetched successfully",
      data: {
        categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
