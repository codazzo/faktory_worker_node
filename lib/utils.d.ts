export declare function encode(object: Record<string, unknown>): string;
export declare function sleep(ms: number, value?: unknown): Promise<unknown>;
/**
 * wraps things that are not errors in an error object
 * @param  {*} object likely a string that was thrown instead of an error
 * @return {Error}        an error with a warning about throwing non-errors
 * @private
 */
export declare function wrapNonErrors(object: string | Error | undefined): Error;
/**
 * hashes the password with server-provided salt
 * @param  {String} password   the password to the faktory server
 * @param  {String} salt       the server-provided salt to use in hashing
 * @param  {Number} iterations the number of time to apply the salt
 * @return {String}            the password hash
 * @private
 */
export declare function hash(password: string, salt: string, iterations: number): string;
