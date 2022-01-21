"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const debug_1 = __importDefault(require("debug"));
const uuid_1 = require("uuid");
const assert_1 = require("assert");
const events_1 = require("events");
const client_1 = require("./client");
const utils_1 = require("./utils");
const utils_2 = require("./utils");
const create_execution_chain_1 = __importDefault(require("./create-execution-chain"));
const debug = debug_1.default("faktory-worker:worker");
/**
 * Representation of a worker process with many concurrent job processors. Works at the
 * concurrency set in options during construction. Will hold at most `concurrency` jobs
 * in-memory while processing at any one time. Listens for signals to quiet or shutdown.
 * Should not be started more than once per-process, nor should more than one worker be
 * started per-process.
 *
 * @example
 * const worker = new Worker({
 *   queues: ['critical', 'default', 'low'],
 * });
 *
 * worker.work();
 */
class Worker extends events_1.EventEmitter {
    /**
     * @param {object} [options]
     * @param  {String} [options.wid=uuid().slice(0, 8)]: the wid the worker will use
     * @param  {Number} [options.concurrency=20]: how many jobs this worker can process at once
     * @param  {Number} [options.shutdownTimeout=8]: the amount of time in seconds that the worker
     *                                             may take to finish a job before exiting
     *                                             ungracefully
     * @param  {Number} [options.beatInterval=15]: the amount of time in seconds between each
     *                                             heartbeat
     * @param  {string[]} [options.queues=['default']]: the queues this worker will fetch jobs from
     * @param  {function[]} [options.middleware=[]]: a set of middleware to run before performing
     *                                               each job
     *                                       in koa.js-style middleware execution signature
     * @param  {Registry} [options.registry=Registry]: the job registry to use when working
     * @param {Number} [options.poolSize=concurrency+2] the client connection pool size for
     *                                                  this worker
     */
    constructor(options = {}) {
        super();
        this.wid = options.wid || uuid_1.v4().slice(0, 8);
        this.concurrency = options.concurrency || 20;
        this.shutdownTimeout = (options.timeout || 8) * 1000;
        this.beatInterval = (options.beatInterval || 15) * 1000;
        this.queues = options.queues || [];
        if (this.queues.length === 0) {
            this.queues = ["default"];
        }
        this.middleware = options.middleware || [];
        this.registry = options.registry || {};
        this.working = new Map();
        this.client = new client_1.Client({
            wid: this.wid,
            url: options.url,
            host: options.host,
            port: options.port,
            password: options.password,
            poolSize: options.poolSize || this.concurrency + 2,
            labels: options.labels || [],
        });
        this.on("error", this.onerror);
    }
    async tick() {
        if (this.quieted)
            return;
        try {
            if (this.working.size >= this.concurrency) {
                await Promise.race(this.working.values());
            }
            else {
                const job = await this.fetch();
                if (job) {
                    const { jid } = job;
                    this.working.set(jid, this.handle(job));
                }
            }
        }
        catch (e) {
            this.emit("error", e);
            await utils_2.sleep(1000);
        }
        finally {
            this.tick();
        }
    }
    /**
     * starts the worker fetch loop and job processing
     *
     * @return self, when working has been stopped by a signal or concurrent
     *                        call to stop or quiet
     * @see  Worker.quiet
     * @see  Worker.stop
     */
    async work() {
        debug("work concurrency=%i", this.concurrency);
        this.execute = create_execution_chain_1.default(this.middleware, this.registry);
        await this.beat();
        this.pulse = setInterval(async () => {
            try {
                await this.beat();
            }
            catch (error) {
                this.emit("error", new Error(`Worker failed heartbeat: ${error.message}\n${error.stack}`));
            }
        }, this.beatInterval);
        this.trapSignals();
        this.tick();
        return this;
    }
    /**
     * Signals to the worker to discontinue fetching new jobs and allows the worker
     * to continue processing any currently-running jobs
     */
    quiet() {
        debug("quiet");
        this.quieted = true;
    }
    /**
     * stops the worker
     *
     * @return {promise} resolved when worker stops
     */
    async stop() {
        Worker.removeSignalHandlers();
        debug("stop");
        this.quiet();
        clearInterval(this.pulse);
        let forced = false;
        return new Promise(async (resolve) => {
            const timeout = setTimeout(async () => {
                debug("shutdown timeout exceeded");
                forced = true;
                // @TODO fail in progress jobs so they retry faster
                this.client.close();
                resolve();
                process.exit(1);
            }, this.shutdownTimeout);
            process.nextTick(async () => {
                try {
                    debug("awaiting in progress");
                    await Promise.all(this.working.values());
                    debug("all clear");
                    if (forced)
                        return;
                    await this.client.close();
                    clearTimeout(timeout);
                    resolve();
                }
                catch (e) {
                    console.warn("error during graceful shutdown:", e);
                }
            });
        });
    }
    /**
     * Sends a heartbeat for this server and interprets the response state (if present)
     * to quiet or terminate the worker
     */
    async beat() {
        const response = await this.client.beat();
        switch (response) {
            case "quiet":
                this.quiet();
                break;
            case "terminate":
                this.stop();
                break;
            default:
                break;
        }
    }
    /**
     * Fetches a job from the defined queues.
     *
     * @private
     * @return {JobPayload|null} a job payload from the server or null when there are
     *                             no jobs
     */
    fetch() {
        return this.client.fetch(...this.queues);
    }
    /**
     * Handles a job from the server by executing it and either acknowledging
     * or failing the job when done
     *
     * @private
     * @param  {JobPayload} job the job payload from the server
     * @return {Promise<string>} 'ack' or 'fail' depending on job handling resu
     */
    async handle(job) {
        const { jid } = job;
        let error;
        try {
            debug(`executing ${jid}`);
            await this.execute({ job });
        }
        catch (e) {
            error = utils_1.wrapNonErrors(e);
        }
        try {
            if (!error) {
                await this.client.ack(jid);
                debug(`ACK ${jid}`);
                return "done";
            }
            else {
                await this.client.fail(jid, error);
                debug(`FAIL ${jid}`);
                this.emit("fail", { job, error });
                return "fail";
            }
        }
        catch (e) {
            this.emit("error", e);
            return "error";
        }
        finally {
            this.working.delete(jid);
        }
    }
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
        this.middleware.push(fn);
        return this;
    }
    onerror(error) {
        if (this.listenerCount("error") === 1)
            console.error(error);
    }
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
        this.registry[name] = fn;
        return this;
    }
    /**
     * @private
     */
    trapSignals() {
        // istanbul ignore next
        process
            .once("SIGTERM", () => this.stop())
            .once("SIGTSTP", () => this.quiet())
            .once("SIGINT", () => this.stop());
    }
    static removeSignalHandlers() {
        process
            .removeAllListeners("SIGTERM")
            .removeAllListeners("SIGTSTP")
            .removeAllListeners("SIGINT");
    }
}
exports.Worker = Worker;
