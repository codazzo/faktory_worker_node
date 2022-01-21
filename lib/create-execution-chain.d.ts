import { ComposedMiddleware } from "koa-compose";
import { Middleware, MiddlewareContext, Registry } from "./worker";
/**
 * Builds a koa-compose stack of the middleware functions in addition to
 * two worker-added middleware functions for pulling the job function from the
 * registry and calling the job function and/or thunk
 *
 * @private
 * @return {function} entrypoint function to the middleware stack
 */
export default function createExecutionChain(middleware: Middleware[], registry: Registry): ComposedMiddleware<MiddlewareContext>;
