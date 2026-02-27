/**
 * Input Sanitization Middleware
 *
 * Provides helper utilities so route handlers and controllers can
 * explicitly sanitize string values before persisting them.
 *
 * Note: XSS stripping at the HTTP layer is handled globally by
 * the `xss-clean` package in app.js. This module provides
 * supplementary, explicit field-level sanitization helpers.
 */

/**
 * Strip characters commonly used for XSS / HTML injection from a string.
 * Removes angle brackets and script-pattern content.
 *
 * @param {string} value
 * @returns {string}
 */
const stripHtml = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<[^>]*>/g, '')       // Strip any HTML tags: <script>, <img>, etc.
        .replace(/javascript:/gi, '')  // Strip javascript: URI scheme
        .replace(/on\w+\s*=/gi, '')    // Strip inline event handlers: onload=, onclick=
        .trim();
};

/**
 * Sanitize a plain object's string fields recursively.
 * Safe to call on req.body / req.query objects.
 *
 * @param {object} obj
 * @returns {object}
 */
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = stripHtml(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = sanitizeObject(value);
        } else {
            result[key] = value;
        }
    }
    return result;
};

/**
 * Express middleware: sanitize specific body fields by name.
 *
 * Usage in a route:
 *   router.post('/products', sanitizeFields('name', 'description'), handler)
 *
 * @param {...string} fields - Field names to sanitize from req.body
 */
const sanitizeFields = (...fields) => (req, res, next) => {
    if (req.body) {
        fields.forEach((field) => {
            if (typeof req.body[field] === 'string') {
                req.body[field] = stripHtml(req.body[field]);
            }
        });
    }
    next();
};

module.exports = {
    stripHtml,
    sanitizeObject,
    sanitizeFields,
};
