const errorHandler = (err, req, res, next) => {
  // 1. Default Error State
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = err.code || "SERVER_ERROR";

  // 2. Logic: Handle Mongoose Validation Errors (UX Win)
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_FAILED";
    // Map through fields to tell the UI exactly which input failed
    const fields = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return res.status(statusCode).json({
      success: false,
      error: "Invalid Data",
      code: errorCode,
      details: fields, // React can map this to show red borders on inputs
    });
  }

  // 3. Logic: Handle Mongoose Duplicate Key (e.g., Email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    errorCode = "DUPLICATE_ENTRY";
    message = `The ${Object.keys(err.keyValue)} provided is already in use.`;
  }

  // 4. Logic: Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "INVALID_TOKEN";
    message = "Your session is invalid. Please log in again.";
  }

  // 5. Final Structured Response
  res.status(statusCode).json({
    success: false,
    error: message,
    code: errorCode,
    // Only show stack trace in development mode (Security Win)
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler