const advancedResults = (model, populate) => async (req, res, next) => {
  console.log('advancedResults is called!');
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
  query = model.find(JSON.parse(queryStr));
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
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // execute the query
  const results = await query;

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

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  // call next because it is middleware
  next();
};

module.exports = advancedResults;
