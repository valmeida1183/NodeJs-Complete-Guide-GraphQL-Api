exports.mapModelToRawObject = mongooseObj => {
    return {
        ...mongooseObj._doc,
        _id: mongooseObj._id.toString(),
        createdAt: mongooseObj.createdAt.toISOString(),
        updatedAt: mongooseObj.updatedAt.toISOString(),
    };
};
