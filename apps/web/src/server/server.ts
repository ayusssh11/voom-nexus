import { createServer, Server, IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { MemoryDataStore, defaultDataStore } from '../store/data-store.js';
import { handleRequest } from './router.js';
import { logger } from '@voom-nexus/shared';

export interface InjectedResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  json: () => any;
}

export class VoomWebServer {
  private server: Server | null = null;
  private store: MemoryDataStore;

  constructor(store: MemoryDataStore = defaultDataStore) {
    this.store = store;
  }

  getStore(): MemoryDataStore {
    return this.store;
  }

  /**
   * Starts native HTTP server on specified port (default: 4000)
   */
  async start(port = 4000): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        handleRequest(req, res, this.store).catch((err) => {
          logger.error('Unhandled server error', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        });
      });

      this.server.listen(port, () => {
        const address = this.server?.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        logger.info(`Voom Nexus Web Server listening on port ${actualPort}`);
        resolve(actualPort);
      });

      this.server.on('error', (err) => reject(err));
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }

  /**
   * In-memory request injection for fast testing without binding network sockets
   */
  async inject(method: string, path: string, body?: any): Promise<InjectedResponse> {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = path;
    req.headers = { host: 'localhost:4000', 'content-type': 'application/json' };

    let resBody = '';
    const resHeaders: Record<string, string | string[] | undefined> = {};
    let statusCode = 200;

    const res = new ServerResponse(req);
    res.setHeader = (name: string, value: string | string[]) => {
      resHeaders[name.toLowerCase()] = value;
      return res;
    };
    res.writeHead = (code: number) => {
      statusCode = code;
      return res;
    };

    const promise = new Promise<InjectedResponse>((resolve) => {
      res.end = (chunk?: any) => {
        if (chunk) {
          resBody += chunk.toString();
        }
        statusCode = res.statusCode || statusCode;
        resolve({
          statusCode,
          headers: resHeaders,
          body: resBody,
          json: () => JSON.parse(resBody)
        });
        return res;
      };
    });

    handleRequest(req, res, this.store);

    if (body) {
      req.emit('data', Buffer.from(JSON.stringify(body)));
    }
    req.emit('end');

    return promise;
  }
}
