function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this username already exists.',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
