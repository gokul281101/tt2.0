const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    let admin = await User.findOne({ email: 'admin@jsfinance.com' });
    if (!admin) {
      admin = await User.create({ name: 'Admin', email: 'admin@jsfinance.com', password: 'admin123' });
    }
    req.user = admin;
    next();
  } catch (error) {
    next();
  }
};
