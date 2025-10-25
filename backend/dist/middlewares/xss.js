import { inHTMLData } from 'xss-filters';
/**
 * Clean for xss.
 * @param {string/object} data - The value to sanitize
 * @return {string/object} The sanitized value
 */
export const clean = (data = '') => {
    let isObject = false;
    if (typeof data === 'object') {
        data = JSON.stringify(data);
        isObject = true;
    }
    data = inHTMLData(data).trim();
    if (isObject)
        data = JSON.parse(data);
    return data;
};
function updateQuery(req, value) {
    Object.defineProperty(req, 'query', {
        ...Object.getOwnPropertyDescriptor(req, 'query'),
        writable: false,
        value
    });
}
const middleware = () => {
    return (req, res, next) => {
        if (req.body)
            req.body = clean(req.body);
        updateQuery(req, clean(req.query));
        req.params = clean(req.params);
        next();
    };
};
export default middleware;
