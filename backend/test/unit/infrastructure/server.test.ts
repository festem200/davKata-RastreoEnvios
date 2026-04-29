import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.CORS_ORIGIN ??= 'http://localhost:4200';

let createServer: typeof import('../../../src/infrastructure/server.js').createServer;
let server: Server | undefined;

jest.unstable_mockModule('../../../src/infrastructure/repositories/prisma-route.repository.js', () => ({
  PrismaRouteRepository: class PrismaRouteRepository {}
}));

jest.unstable_mockModule('../../../src/infrastructure/repositories/prisma-user.repository.js', () => ({
  PrismaUserRepository: class PrismaUserRepository {}
}));

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

  it('rate limits login after 5 attempts per minute by IP', async () => {
    const baseUrl = await listen();
    const loginRequest = () =>
      fetch(`${baseUrl}/api/auth/login`, {
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginRequest();

      expect(response.status).toBe(400);
    }

    const limitedResponse = await loginRequest();

    expect(limitedResponse.status).toBe(429);
    await expect(limitedResponse.json()).resolves.toEqual({
      message: 'Demasiados intentos de login. Intenta nuevamente en un minuto'
    });
  });
});
