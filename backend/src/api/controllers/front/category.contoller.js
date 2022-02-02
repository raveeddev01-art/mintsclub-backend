const Category = require('../../models/categories.model');

// API to get active categories list
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find(
      { status: true }
      // { name: 1, image: 1 }
    ).sort({ name: 1 });

    let total = 0;

    if (categories.length == 0) {
      return res.status(400).send({
        status: false,
        message: 'No category Found',
      });
    }
    total = categories.length;
    return res.send({
      status: true,
      message: 'Categories fetched successfully',
      categories,
      count: total,
    });
  } catch (error) {
    console.log(error, 'error');
    return next(error);
  }
};
