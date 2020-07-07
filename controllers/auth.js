const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Create jsonwebtoken
  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password'); // In User model select is set to false, so set it to true here because we do want it included here

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create jsonwebtoken
  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});

// get tokent from model, create cookie and send response
const sedTokentResponse = (user, statusCode, res) => {
  // Create jsonwebtoken
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(),
  };
};
