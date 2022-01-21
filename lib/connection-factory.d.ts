import { Connection, Greeting } from "./connection";
import { Factory } from "generic-pool";
declare type handshaker = {
    (conn: Connection, greeting: Greeting): Promise<string>;
};
/**
 * pools connections to the faktory server, ensuring that they're
 * connected before lending them
 * @private
 */
export declare class ConnectionFactory implements Factory<Connection> {
    host: string;
    port: string | number;
    handshake: handshaker;
    attempts: number;
    onConnectionError: (err: Error) => void;
    /**
     * @param {object} options
     * @param {string} options.host host to connect to
     * @param {string|number} port port to connect to host on
     * @param {function} handshake a function to perform the handshake for a connection
     *                             after it connects
     */
    constructor({ host, port, handshake, }: {
        host: string;
        port: string | number;
        handshake: handshaker;
    });
    /**
     * Creates a connection for the pool
     * connections are not added to the pool until the handshake (server greeting)
     * is complete and successful
     */
    create(): Promise<Connection>;
    /**
     * Destroys a connection from the pool
     */
    destroy(connection: Connection): Promise<void>;
    /**
     * Validates that a connection from the pool is ready
     */
    validate(connection: Connection): Promise<boolean>;
}
export {};
