const catchAsync = (fn) => (req, res, next) => {
    const reqWithValidatedQuery = req;
    if (!reqWithValidatedQuery.validatedQuery) {
        reqWithValidatedQuery.validatedQuery = req.query;
    }
    Promise.resolve(fn(reqWithValidatedQuery, res, next)).catch(err => next(err));
};
export default catchAsync;
