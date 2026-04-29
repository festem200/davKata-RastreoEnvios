import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.CORS_ORIGIN ??= 'http://localhost:4200';

let createServer: typeof import('../../../src/infrastructure/server.js').createServer;
let server: Server | undefined;

const listen = async (): Promise<string> => {
  const app = createServer();

  server = app.listen(0);

  await new Promise<void>((resolve) => {
    server?.once('listening', resolve);
  });

  const address = server.address() as AddressInfo;

  return `http://127.0.0.1:${address.port}`;
};

describe('createServer', () => {
  beforeAll(async () => {
    ({ createServer } = await import('../../../src/infrastructure/server.js'));
  });

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    server = undefined;
  });

  it('applies Helmet security headers to HTTP responses', async () => {
    const baseUrl = await listen();
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('x-dns-prefetch-control')).toBe('off');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('uses the configured explicit CORS origin instead of a wildcard', async () => {
    const baseUrl = await listen();
    const response = await fetch(`${baseUrl}/health`, {
      headers: {
        Origin: 'http://localhost:4200'
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
    expect(response.headers.get('access-control-allow-origin')).not.toBe('*');
  });
});
