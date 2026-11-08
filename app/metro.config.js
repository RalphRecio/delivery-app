const http = require('node:http');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Development only: the web app calls the API on its own origin (/api/...)
 * and this dev server forwards those requests to Laravel. One address then
 * serves both, so the app works the same on localhost, on a phone on the LAN,
 * or through a public tunnel, with no CORS and no browser "loopback" block.
 * Production web builds are served elsewhere and point at the real API.
 */
const API_PREFIX = '/api/';
const API_TARGET = new URL(process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8000');

const previousEnhance = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const middleware = previousEnhance ? previousEnhance(metroMiddleware, server) : metroMiddleware;

  return (req, res, next) => {
    if (req.url === undefined || !req.url.startsWith(API_PREFIX)) {
      return middleware(req, res, next);
    }

    const upstream = http.request(
      {
        hostname: API_TARGET.hostname,
        port: API_TARGET.port,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, host: API_TARGET.host },
      },
      (apiResponse) => {
        res.writeHead(apiResponse.statusCode ?? 502, apiResponse.headers);
        apiResponse.pipe(res);
      },
    );

    upstream.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'The API is not running. Start it with `php artisan serve` in backend/.',
          data: null,
          errors: {},
        }),
      );
    });

    req.pipe(upstream);
  };
};

module.exports = config;
