import { Client } from "./client";
/**
 * Discriminator used by a worker to decide how to execute a job. This will be the name you
 * used during register.
 *
 * @typedef Jobtype
 * @type {string}
 * @external
 * @example
 * // where `MyFunction` is the jobtype
 *
 * faktory.register('MyFunction', () => {})
 * @see  {@link https://github.com/contribsys/faktory/wiki/The-Job-Payload}
 */
export declare type JobType = string;
export interface JobCustomParams {
    [propName: string]: unknown;
}
/**
 * A work unit that can be scheduled by the faktory work server and executed by clients
 *
 * @typedef {object} JobPayload
 * @see  {@link https://github.com/contribsys/faktory/wiki/The-Job-Payload}
 * @external
 * @property {string} [jid=uuid()] globally unique ID for the job.
 * @property {external:Jobtype} jobtype
 * @property {string} [queue=default] which job queue to push this job onto.
 * @property {array} [args=[]] parameters the worker should use when executing the job.
 * @property {number} [priority=5] higher priority jobs are dequeued before lower priority jobs.
 * @property {number} [retry=25] number of times to retry this job if it fails. 0 discards the
 *                               failed job, -1 saves the failed job to the dead set.
 * @property {external:RFC3339_DateTime} [at] run the job at approximately this time; immediately if blank
 * @property {number} [reserve_for=1800] number of seconds a job may be held by a worker before it
 *                                       is considered failed.
 * @property {?object} custom provides additional context to the worker executing the job.
 * @see  {@link https://github.com/contribsys/faktory/blob/master/docs/protocol-specification.md#work-units|Faktory Protocol Specification - Work Units}
 */
export declare type PartialJobPayload = {
    jid?: string;
    jobtype: string;
    queue: string;
    args: unknown[];
    priority?: number;
    retry?: number;
    custom?: JobCustomParams;
    at?: Date | string;
    reserve_for?: number;
};
export declare type JobPayload = PartialJobPayload & {
    jid: string;
};
/**
 * A class wrapping a {@link external:JobPayload|JobPayload}
 *
 * Creating and pushing a job is typically accomplished by using
 * a faktory client, which implements `.job` and automatically
 * sets the client for the job when calling `.push` on the job later.
 *
 * You do not need to use this class directly.`
 *
 * @example <caption>with a faktory client</caption>
 * // with a client
 * const client = await faktory.connect();
 * const job = client.job('SendWelcomeEmail', id);
 */
export declare class Job {
    client: Client;
    payload: JobPayload;
    /**
     * Creates a job
     *
     * @param  {string} jobtype {@link external:Jobtype|Jobtype} string
     * @param  {Client} [client]  a client to use for communicating to the server (if calling push)
     */
    constructor(jobtype: string, client: Client);
    get jid(): string;
    /**
     * sets the jid
     *
     * @param  {string} value the >8 length jid
     * @see  external:JobPayload
     */
    set jid(value: string);
    get jobtype(): string;
    set jobtype(value: string);
    get queue(): string;
    /**
     * sets the queue
     *
     * @param  {string} value queue name
     * @see  external:JobPayload
     */
    set queue(value: string);
    get args(): unknown[];
    /**
     * sets the args
     *
     * @param  {Array} value array of positional arguments
     * @see  external:JobPayload
     */
    set args(args: unknown[]);
    get priority(): number | undefined;
    /**
     * sets the priority of this job
     *
     * @param  {number} value 0-9
     * @see  external:JobPayload
     */
    set priority(value: number | undefined);
    get retry(): number | undefined;
    /**
     * sets the retry count
     *
     * @param  {number} value {@see external:JobPayload}
     * @see  external:JobPayload
     */
    set retry(value: number | undefined);
    get at(): Date | string | undefined;
    /**
     * sets the scheduled time
     *
     * @param  {Date|string} value the date object or RFC3339 timestamp string
     * @see  external:JobPayload
     */
    set at(value: Date | string | undefined);
    get reserveFor(): number | undefined;
    /**
     * sets the reserveFor parameter
     *
     * @param  {number} value
     * @see  external:JobPayload
     */
    set reserveFor(value: number | undefined);
    get custom(): JobCustomParams | undefined;
    /**
     * sets the custom object property
     *
     * @param  {object} value the custom data
     * @see  external:JobPayload
     */
    set custom(custom: JobCustomParams | undefined);
    /**
     * Generates an object from this instance for transmission over the wire
     *
     * @return {object} the job as a serializable javascript object
     *                      @link external:JobPayload|JobPayload}
     * @see  external:JobPayload
     */
    toJSON(): PartialJobPayload;
    /**
     * Pushes this job to the faktory server. Modifications after this point are not
     * persistable to the server
     *
     * @return {string} return of client.push(job)
     */
    push(): Promise<string>;
    static get defaults(): PartialJobPayload;
    /**
     * generates a uuid
     *
     * @return {string} a uuid/v4 string
     */
    static jid(): string;
}
