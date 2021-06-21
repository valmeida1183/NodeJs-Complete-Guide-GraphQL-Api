exports.handleError = (error, next, errorCode = 500) => {
    if (!error.statusCode) {
        error.statusCode = errorCode;
    }
    next(error);
};

exports.throwError = (message, errorCode = 500, errorsArray = []) => {
    const error = new Error(message);
    error.code = errorCode;

    if (errorsArray.length > 0) {
        error.data = errorsArray;
    }

    throw error;
};
