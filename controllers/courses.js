const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

// @desc      Get courses
// @route     GET /api/v1/courses
// @desc      Get all courses associated with a single bootcamp
// @route     GET /api/v1/bootcamps/:bootcampId/courses
// @access    Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  // /api/v1/bootcamps/:bootcampId/courses
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single course
// @route     GET /api/v1/courses/:id
// @access    Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description', // populate bootcamp field with name and description fields
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Create a course
// @route     POST /api/v1/bootcamps/:bootcampId/courses
// @access    Private
exports.createCourse = asyncHandler(async (req, res, next) => {
  // for the bootcamp field of the Course model
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  // Find the bootcamp for validation
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  // check if bootcamp exists for validation
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp with the id of ${req.params.bootcampId}`,
        404
      )
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
        404
      )
    );
  }

  // create and save the new ccourse
  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Update a course
// @route     POST /api/v1/courses/:id
// @access    Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  // Find the course
  let course = await Course.findById(req.params.id);

  // check if course exists for validation
  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update course ${course._id}`,
        404
      )
    );
  }

  // Update the new course
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // save the updated course
  course.save();

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Delete a course
// @route     DELETE /api/v1/courses/:id
// @access    Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  // Find the course
  const course = await Course.findById(req.params.id);

  // check if course exists for validation
  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete course ${course._id}`,
        404
      )
    );
  }

  // Delete the course using remove so we can use middleware. findByIdAndDelete will not let you use middleware
  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
