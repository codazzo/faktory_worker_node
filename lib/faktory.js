"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = exports.Job = exports.Client = exports.Worker = exports.create = void 0;
const debug_1 = __importDefault(require("debug"));
const assert_1 = require("assert");
const client_1 = require("./client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_1.Client; } });
const worker_1 = require("./worker");
Object.defineProperty(exports, "Worker", { enumerable: true, get: function () { return worker_1.Worker; } });
const job_1 = require("./job");
Object.defineProperty(exports, "Job", { enumerable: true, get: function () { return job_1.Job; } });
const mutation_1 = require("./mutation");
Object.defineProperty(exports, "Mutation", { enumerable: true, get: function () { return mutation_1.Mutation; } });
const debug = debug_1.default("faktory-worker");
/**
 * creates faktory singletons
 *
 * @module faktory
 */
function create() {
    const middleware = [];
    const registry = {};
    let worker;
    /**
     *
     * A singleton holds most of the methods you'll need to get started registering jobs,
     * connecting to the server, pushing jobs, or starting a worker. Only use this is you'd like to
     * create multiple faktory instances in one process (testing).
     *
     * @private
     */
    return {
        Worker: worker_1.Worker,
        Client: client_1.Client,
        Job: job_1.Job,
        Mutation: mutation_1.Mutation,
        create,
        /**
         * Returns the registry for the faktory singleton
         *
         * @private
         * @instance
         * @return {Registry}
         */
        get registry() {
            return registry;
        },
        /**
         * Returns the middleware stack for the faktory singleton
         *
         * @private
         * @instance
         * @return {Middleware} array of middleware functions with koa-compose-style signatures
         */
        get middleware() {
            return middleware;
        },
        /**
         * Adds a middleware function to the stack
         *
         * @param  {Function} fn koa-compose-style middleware function
         * @return {FaktoryControl}      this
         * @instance
         * @see  {@link https://github.com/koajs/koa/blob/master/docs/guide.md#writing-middleware|koa middleware}
         * @example
         * faktory.use(async (ctx, next) => {
         *   // a pool you created to hold database connections
         *   pool.use(async (conn) => {
         *     ctx.db = conn;
         *     await next();
         *   });
         * });
         */
        use(fn) {
            assert_1.strict(typeof fn === "function");
            debug("use %s", fn.name || "-");
            middleware.push(fn);
            return this;
        },
        /**
         * Adds a {@link external:JobFunction|JobFunction} to the {@link Registry}
         *
         * @param  {external:Jobtype}   name string descriptor for the jobtype
         * @param  {external:JobFunction} fn
         * @return {FaktoryControl}        this
         * @instance
         * @example
         * faktory.register('MyJob', (...args) => {
         *   // some work
         * });
         */
        register(name, fn) {
            assert_1.strict(typeof fn === "function", "a registered job must be a function");
            debug("registered %s", name);
            registry[name] = fn;
            return this;
        },
        /**
         * Creates a new {@link Client}
         *
         * @param  {...*} args args forwarded to {@link Client}
         * @return {Client}
         * @instance
         * @example
         * const client = await faktory.connect();
         *
         * await client.push(job);
         */
        connect(options) {
            return new client_1.Client(options).connect();
        },
        /**
         * Starts a worker. Resolves after the worker is started. Only call this
         * once per-process.
         *
         * @param  {object} options options to {@link Worker}
         * @return {Promise}         the {@link Worker.work} promise
         * @instance
         * @example
         * // this keeps the process open and can be `await`ed
         * faktory.work();
         */
        work(options = {}) {
            if (worker)
                throw new Error("can only call .work once per singleton");
            worker = new worker_1.Worker(Object.assign({}, options, { registry, middleware }));
            return worker.work();
        },
        /**
         * Stops the worker previously started.
         *
         * @return {promise} promise returned by {@link Worker.stop}
         * @instance
         * @example
         * // previously
         * faktory.work();
         *
         * faktory.stop();
         */
        stop() {
            if (worker) {
                const existing = worker;
                worker = undefined;
                if (existing)
                    return existing.stop();
            }
            return Promise.resolve();
        },
    };
}
exports.create = create;
const singleton = create();
// exclusively for the typedescript declaration file
exports.default = singleton;
module.exports = singleton;
