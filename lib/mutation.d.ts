import { JobType } from "./job";
import { Client } from "./client";
/**
 * @private
 */
declare enum Verb {
    CLEAR = "clear",
    KILL = "kill",
    DISCARD = "discard",
    REQUEUE = "requeue"
}
/**
 * @private
 */
declare enum Target {
    RETRIES = "retries",
    SCHEDULED = "scheduled",
    DEAD = "dead"
}
export declare const SCHEDULED = Target.SCHEDULED;
export declare const RETRIES = Target.RETRIES;
export declare const DEAD = Target.DEAD;
export declare type Filter = {
    jobtype?: JobType;
    pattern?: string;
    jids?: Array<string>;
    regexp?: string;
};
/**
 * A wrapper for the [Mutate API](https://github.com/contribsys/faktory/wiki/Mutate-API)
 *
 * A low-level data management API to script certain repairs or migrations.
 *
 * !!! Please be warned: MUTATE commands can be slow and/or resource intensive.
 * **They should not be used as part of your application logic.**
 */
export declare class Mutation {
    client: Client;
    target: Target;
    filter: Filter;
    cmd: Verb;
    /**
     * @param {Client} client
     */
    constructor(client: Client);
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
    ofType(jobtype: JobType): Mutation;
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
    withJids(...jids: string[] | [string[]]): Mutation;
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
    matching(pattern: string): Mutation;
    /**
     * @private
     */
    private toJSON;
    /**
     * Executes a *clear* mutation. This clears the
     * set entirely **and any filtering added does not apply**.
     */
    clear(): PromiseLike<string>;
    /**
     * Executes a *kill* mutation. Jobs that are killed are sent to the dead set.
     */
    kill(): PromiseLike<string>;
    /**
     * Executes a *discard* mutation. Jobs that are discarded are permanently deleted.
     */
    discard(): PromiseLike<string>;
    /**
     * Executes a *requeue* mutation. Jobs that are requeued are sent back to their
     * original queue for processing.
     */
    requeue(): PromiseLike<string>;
    /**
     * @private
     */
    send(): PromiseLike<string>;
}
export {};
