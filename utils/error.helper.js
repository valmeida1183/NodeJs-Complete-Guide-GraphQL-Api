exports.handleError = (error, next, errorCode = 500) => {
    if (!error.statusCode) {
        error.statusCode = errorCode;
    }
    next(error);
};

exports.throwError = (message, errorCode = 400, errorsArray = []) => {
    const error = new Error(message);
    error.statusCode = errorCode;

    if (errorsArray.length > 0) {
        error.data = errorsArray;
    }

    throw error;
};
