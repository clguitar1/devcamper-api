// create a class extending the browser's Error constructor
class ErrorResponse extends Error {
  // create and initialize an object within the ErrorResponse class
  // A constructor enables you to provide any custom initialization that must be done before any other methods can be called on an instantiated object.
  constructor(message, statusCode) {
    // if your class extends a parent class, then you must explicitly call the parent class constructor using super
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
