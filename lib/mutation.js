"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutation = exports.DEAD = exports.RETRIES = exports.SCHEDULED = void 0;
const utils_1 = require("./utils");
const MUTATE = "MUTATE";
/**
 * @private
 */
var Verb;
(function (Verb) {
    Verb["CLEAR"] = "clear";
    Verb["KILL"] = "kill";
    Verb["DISCARD"] = "discard";
    Verb["REQUEUE"] = "requeue";
})(Verb || (Verb = {}));
/**
 * @private
 */
var Target;
(function (Target) {
    Target["RETRIES"] = "retries";
    Target["SCHEDULED"] = "scheduled";
    Target["DEAD"] = "dead";
})(Target || (Target = {}));
exports.SCHEDULED = Target.SCHEDULED;
exports.RETRIES = Target.RETRIES;
exports.DEAD = Target.DEAD;
/**
 * A wrapper for the [Mutate API](https://github.com/contribsys/faktory/wiki/Mutate-API)
 *
 * A low-level data management API to script certain repairs or migrations.
 *
 * !!! Please be warned: MUTATE commands can be slow and/or resource intensive.
 * **They should not be used as part of your application logic.**
 */
class Mutation {
    /**
     * @param {Client} client
     */
    constructor(client) {
        this.client = client;
        this.filter = {};
    }
    /**
     * Filters the affected jobs by a jobtype string.
     * Use this to ensure you're only affecting a single jobtype if applicable.
     * Can be chained.
     *
     * Note: jobtype and other filters do not apply for the *clear* command.
     *
     * @param {string} type jobtype fiter for operation
     * @example
     * client.dead.ofType('SendEmail').discard();
     */
    ofType(jobtype) {
        if (typeof jobtype !== "string") {
            throw new Error("jobtype given to ofType must be a string");
        }
        this.filter.jobtype = jobtype;
        return this;
    }
    /**
     * Filters the affected jobs by one or more job ids. This is much more
     * efficient when only one jid is provided. Can be chained.
     *
     * Note: jobtype and other filters do not apply for the *clear* command.
     *
     * @param  {...string} jids job ids to target for the operation
     * @example
     * await client.retries.withJids('1234').requeue();
     */
    withJids(...jids) {
        let ids;
        if (Array.isArray(jids[0])) {
            ids = jids[0];
        }
        else {
            ids = jids;
        }
        this.filter.jids = ids;
        return this;
    }
    /**
     * Filters the MUTATE selection to jobs matching a Redis SCAN pattern.
     * Can be chained.
     *
     * Note the regexp filter scans the entire job payload and can be tricky to
     * get right, for instance you'll probably need * on both sides. The regexp
     * filter option is passed to Redis's SCAN command directly, read the SCAN
     * documentation for further details.
     * https://redis.io/commands/scan
     *
     * @param {string} pattern redis SCAN pattern to target jobs for the operation
     * @example
     * await client.retries.matching("*uid:12345*").kill();
     */
    matching(pattern) {
        if (typeof pattern !== "string") {
            throw new Error(`
Argument given to matching() must be a redis SCAN compatible pattern string,
other object types cannot be translated.
See the Redis SCAN documentation for pattern matching examples.
https://redis.io/commands/scan
      `.trim());
        }
        this.filter.regexp = pattern;
        return this;
    }
    /**
     * @private
     */
    toJSON() {
        return {
            cmd: this.cmd,
            target: this.target,
            filter: this.filter,
        };
    }
    /**
     * Executes a *clear* mutation. This clears the
     * set entirely **and any filtering added does not apply**.
     */
    clear() {
        this.cmd = Verb.CLEAR;
        return this.send();
    }
    /**
     * Executes a *kill* mutation. Jobs that are killed are sent to the dead set.
     */
    kill() {
        this.cmd = Verb.KILL;
        return this.send();
    }
    /**
     * Executes a *discard* mutation. Jobs that are discarded are permanently deleted.
     */
    discard() {
        this.cmd = Verb.DISCARD;
        return this.send();
    }
    /**
     * Executes a *requeue* mutation. Jobs that are requeued are sent back to their
     * original queue for processing.
     */
    requeue() {
        this.cmd = Verb.REQUEUE;
        return this.send();
    }
    /**
     * @private
     */
    send() {
        return this.client.sendWithAssert([MUTATE, utils_1.encode(this.toJSON())], "OK");
    }
}
exports.Mutation = Mutation;
