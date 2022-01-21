"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = exports.wrapNonErrors = exports.sleep = exports.encode = void 0;
const crypto_1 = require("crypto");
function encode(object) {
    return JSON.stringify(object);
}
exports.encode = encode;
function sleep(ms, value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
exports.sleep = sleep;
/**
 * wraps things that are not errors in an error object
 * @param  {*} object likely a string that was thrown instead of an error
 * @return {Error}        an error with a warning about throwing non-errors
 * @private
 */
function wrapNonErrors(object) {
    if (object instanceof Error)
        return object;
    console.warn(`
Job failed without providing an error.
Ensure your promise was rejected with an *Error* and not a *String*

correct:\treject(new Error('message'))
incorrect:\treject('message')
  `);
    return new Error(object || "Job failed with no error or message given");
}
exports.wrapNonErrors = wrapNonErrors;
/**
 * hashes the password with server-provided salt
 * @param  {String} password   the password to the faktory server
 * @param  {String} salt       the server-provided salt to use in hashing
 * @param  {Number} iterations the number of time to apply the salt
 * @return {String}            the password hash
 * @private
 */
function hash(password, salt, iterations) {
    let hash = crypto_1.createHash("sha256").update(`${password}${salt}`);
    for (let i = 1; i < iterations; i += 1) {
        hash = crypto_1.createHash("sha256").update(hash.digest());
    }
    return hash.digest("hex");
}
exports.hash = hash;
