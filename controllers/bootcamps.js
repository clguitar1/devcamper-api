const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');

// @desc      Get all bootcamps
// @route     GET /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;
  // Copy req.query (Expressjs req.query gets the query from the route)
  const reqQuery = { ...req.query };

  // Fields to exclude from the query
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // loop over removeFields and delete 'select' from reqQuery because mongoosejs docs say to have space separated query fields
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gte, etc...)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Find resourse
  query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');
  // req.query is an Expressjs method
  // select fields - .select is a Mongoosejs method
  if (req.query.select) {
    // change fields from comma separated to space separated like mongoosejs docs say to do
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  // countDocuments is a Mongoose method
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // execute the query
  const bootcamp = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // 200 = OK
  res.status(200).json({
    success: true,
    count: bootcamp.length,
    pagination,
    data: bootcamp,
  });
});

// @desc      Get single bootcamp
// @route     GET /api/v1/bootcamps/:id
// @access    Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // is a formatted Mongoose ObjectId but not in the database
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bootcamp,
  });
});

// @desc      Create new bootcamp
// @route     POST /api/v1/bootcamps
// @access    Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  // 201 = Created
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

// @desc      Update bootcamp
// @route     PUT /api/v1/bootcamps/:id
// @access    Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, msg: 'Updated bootcamp' });
});

// @desc      Delete bootcamp
// @route     DELETE /api/v1/bootcamps/:id
// @access    Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // trigger pre remove middleware in Bootcamp model
  bootcamp.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/:radius/:zipcode/:distance
// @access    Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // get location from geocoder using zipcode
  const loc = await geocoder.geocode(zipcode);
  // get latitude and longitude from geocoder
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calculate radius in radians by dividing distance by radius of Earth
  // Earth Radius = 3,963 mi or 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    /* MongoDB geospatial query operators
    $geoWithin: Selects documents with geospatial data that exists entirely within a specified shape.
    $centerSphere: Defines a circle for a geospatial query that uses spherical geometry. The query returns documents that are within the bounds of the circle.
    */
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});
