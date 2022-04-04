const Category = require('../../models/categories.model');

// API to get active categories list
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find(
      { status: true }
      // { name: 1, image: 1 }
    ).sort({ name: 1 });

    let total = 0;

    total = categories.length;

    if (total == 0) {
      return res.send({
        success: false,
        message: 'No Categories found',
      });
    }

    return res.status(200).send({
      status: true,
      message: 'Categories fetched successfully',
      categories,
      count: total,
    });
  } catch (error) {
    return next(error);
  }
};
