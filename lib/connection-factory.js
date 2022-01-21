"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionFactory = void 0;
const debug_1 = __importDefault(require("debug"));
const connection_1 = require("./connection");
const utils_1 = require("./utils");
const debug = debug_1.default("faktory-worker:connection-pool");
/**
 * pools connections to the faktory server, ensuring that they're
 * connected before lending them
 * @private
 */
class ConnectionFactory {
    /**
     * @param {object} options
     * @param {string} options.host host to connect to
     * @param {string|number} port port to connect to host on
     * @param {function} handshake a function to perform the handshake for a connection
     *                             after it connects
     */
    constructor({ host, port, handshake, }) {
        this.host = host;
        this.port = port;
        this.handshake = handshake;
        this.attempts = 0;
        this.onConnectionError = console.error.bind(console);
    }
    /**
     * Creates a connection for the pool
     * connections are not added to the pool until the handshake (server greeting)
     * is complete and successful
     */
    async create() {
        debug("+1");
        const connection = new connection_1.Connection(this.port, this.host);
        connection.on("error", this.onConnectionError);
        try {
            const greeting = await connection.open();
            await this.handshake(connection, greeting);
            this.attempts = 0;
        }
        catch (e) {
            this.attempts += 1;
            debug("attempts=%i", this.attempts);
            await utils_1.sleep(200 * Math.min(this.attempts, 20));
            throw e;
        }
        return connection;
    }
    /**
     * Destroys a connection from the pool
     */
    destroy(connection) {
        debug("-1");
        connection.on("close", () => connection.removeAllListeners());
        return connection.close();
    }
    /**
     * Validates that a connection from the pool is ready
     */
    async validate(connection) {
        return connection.connected;
    }
}
exports.ConnectionFactory = ConnectionFactory;
