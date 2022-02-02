const Category = require('../../models/categories.model');

// API to get active categories list
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find(
      { status: true }
      // { name: 1, image: 1 }
    ).sort({ name: 1 });

    let total = 0;

    if (categories.length > 0) {
      total = categories.length;
    }
    return res.send({
      success: true,
      message: 'Categories fetched successfully',
      categories,
      count: total,
    });
  } catch (error) {
    console.log(error, 'error');
    return next(error);
  }
};
