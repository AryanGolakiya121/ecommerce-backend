const errorHandler = (err, req, res, next) => {
    console.log("Error in errorHandler->",err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";
    let errors = err.errors || [];

    //joi validation error
    if(err.isJoi) {
        statusCode = 400;
        message = "Validation failed";

        errors = err.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message
        }))
    }

    // Mongoose validation error
    if(err.name === "ValidationError" && err.errors) {
        statusCode = 400;
        message = "Validation failed";

        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message
        }))
    }

    // MongoDB duplicate key error
    if(err.code === 11000) {
        statusCode = 409;
        message = "Duplicate value alrady exists";

        errors = Object.keys(err.keyValue || {}).map((field) => ({
            field,
            message: `${field} already exist`
        }))
    }

    // Unexpeceted server error
    if(statusCode === 500) {
        message = "Internal server error";
        errors = [];
    }

    // Invalid JSON
    // if (
    //     err instanceof SyntaxError &&
    //     err.status === 400 &&
    //     err.type === "entity.parse.failed"
    // ) {
    //     statusCode = 400;
    //     message = "Invalid JSON payload";
    //     errors = [];
    // }
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(req.requestId && { requestId: req.requestId})
    })
}

export default errorHandler;