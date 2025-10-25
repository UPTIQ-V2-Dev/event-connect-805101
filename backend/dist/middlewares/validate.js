import ApiError from "../utils/ApiError.js";
import pick from "../utils/pick.js";
import httpStatus from 'http-status';
import Joi from 'joi';
const validate = (schema) => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const obj = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(obj);
    if (error) {
        const errorMessage = error.details.map(details => details.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
    if (value.body) {
        req.body = value.body;
    }
    if (value.params) {
        req.params = value.params;
    }
    if (value.query) {
        req.validatedQuery = value.query;
    }
    return next();
};
export default validate;
