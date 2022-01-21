import { Middleware as KoaMiddleware } from "koa-compose";
import { Client, ClientOptions } from "./client";
import { Worker, WorkerOptions } from "./worker";
import { Job, JobPayload, JobType } from "./job";
import { Mutation } from "./mutation";
/**
 * A function that executes work
 *
 * @typedef JobFunction
 * @type {function}
 * @external
 * @param {...*} args arguments from the job payload
 * @example
 * function(...args) {
 *   // does something meaningful
 * }
 */
export declare type JobFunctionContextWrapper = {
    (...args: unknown[]): ContextProvider;
};
export declare type UnWrappedJobFunction = {
    (...args: unknown[]): unknown;
};
export declare type JobFunction = JobFunctionContextWrapper | UnWrappedJobFunction;
/**
 * A function returned by a job function that will be called with the job context as its
 * only argument and awaited. This exists to allow you to define simple job functions that
 * only accept their job args, but in many cases you might need the job's custom properties
 * or stateful connections (like a database connection) in your job and want to attach
 * a connection for your job function to use without having to create it itself.
 *
 * @typedef ContextProvider
 * @type {function}
 * @param {object} ctx context object containing the job and any other data attached
 *                     via userland-middleware
 * @example
 * // assumes you have middleware that attaches `db` to `ctx`
 *
 * faktory.register('UserWelcomer', (...args) => async (ctx) => {
 *   const [ id ] = args;
 *   const user = await ctx.db.users.find(id);
 *   const email = new WelcomeEmail(user);
 *   await email.deliver();
 * });
 * @see  Context
 */
export declare type ContextProvider = (ctx: MiddlewareContext) => unknown;
/**
 * A context object passed through middleware and to a job thunk
 *
 * @typedef Context
 * @type {object}
 * @property {object} Context.job the job payload
 * @property {function} Context.fn a reference to the job function
 */
export interface MiddlewareContext {
    job: JobPayload;
    fn?: JobFunction;
}
export declare type Middleware = KoaMiddleware<MiddlewareContext>;
/**
 * A lookup table holding the jobtype constants mapped to their job functions
 *
 * @typedef Registry
 * @type  {Object.<Jobtype, JobFunction>}
 * @see external:Jobtype
 * @see external:JobFunction
 * @example
 * {
 *   SendWelcomeUser: (id) => {
 *     // job fn
 *   },
 *   GenerateThumbnail: (id, size) => {
 *     // job fn
 *   }
 * }
 */
export declare type Registry = {
    [jobtype: string]: JobFunction;
};
export interface FaktoryControl {
    registry: Registry;
    use(fn: Middleware): FaktoryControl;
    middleware: Middleware[];
    register(name: JobType, fn: JobFunction): FaktoryControl;
    connect(options?: ClientOptions): Promise<Client>;
    work(options?: WorkerOptions): Promise<Worker>;
    stop(): Promise<void>;
    Worker: typeof Worker;
    Client: typeof Client;
    Job: typeof Job;
    Mutation: typeof Mutation;
    create: FaktoryControlCreator;
}
export declare type FaktoryControlCreator = {
    (): FaktoryControl;
};
/**
 * creates faktory singletons
 *
 * @module faktory
 */
export declare function create(): FaktoryControl;
export { Worker, WorkerOptions, Client, ClientOptions, Job, Mutation };
declare const singleton: FaktoryControl;
export default singleton;
