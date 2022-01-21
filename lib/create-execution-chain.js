"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_compose_1 = __importDefault(require("koa-compose"));
/**
 * Builds a koa-compose stack of the middleware functions in addition to
 * two worker-added middleware functions for pulling the job function from the
 * registry and calling the job function and/or thunk
 *
 * @private
 * @return {function} entrypoint function to the middleware stack
 */
function createExecutionChain(middleware, registry) {
    return koa_compose_1.default([
        ...middleware,
        function getJobFnFromRegistry(ctx, next) {
            const { job: { jobtype }, } = ctx;
            ctx.fn = registry[jobtype];
            return next();
        },
        async function callJobFn(ctx, next) {
            const { fn, job: { jobtype, args }, } = ctx;
            if (!fn)
                throw new Error(`No jobtype registered: ${jobtype}`);
            const thunkOrPromise = await fn(...args);
            if (typeof thunkOrPromise === "function") {
                await thunkOrPromise(ctx);
            }
            else {
                await thunkOrPromise;
            }
            return next();
        },
    ]);
}
exports.default = createExecutionChain;
