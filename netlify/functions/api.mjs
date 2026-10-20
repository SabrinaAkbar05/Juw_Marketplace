import { handler as apiHandler, getOrInitApp } from '../../server/index.mjs';
import { Readable } from 'node:stream';

export async function handler(event, context) {
  // Ensure Firebase & Firestore are initialized once per warm container
  try {
    await getOrInitApp();
  } catch (err) {
    console.error('Failed to initialize serverless application:', err);
  }

  return new Promise((resolve) => {
    try {
      // 1. Prepare body buffer
      let bodyBuffer = Buffer.from('');
      if (event.body) {
        bodyBuffer = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64')
          : Buffer.from(event.body, 'utf8');
      }

      // 2. Build mock req (Readable Stream)
      const reqStream = Readable.from(bodyBuffer);
      const queryString = event.rawQuery || (event.queryStringParameters ? new URLSearchParams(event.queryStringParameters).toString() : '');
      const fullPath = (event.path || '/') + (queryString ? `?${queryString}` : '');

      const req = Object.assign(reqStream, {
        method: event.httpMethod || 'GET',
        url: fullPath,
        headers: { ...(event.headers || {}) },
        rawHeaders: [],
        body: bodyBuffer.length > 0 ? bodyBuffer.toString('utf8') : undefined,
      });

      // Normalize headers to lowercase keys for standard Node.js http handling
      for (const [k, v] of Object.entries(event.headers || {})) {
        req.headers[k.toLowerCase()] = v;
      }

      // 3. Build mock res to capture response
      let statusCode = 200;
      const responseHeaders = {};
      const responseChunks = [];

      const res = {
        req,
        statusCode: 200,
        writeHead(code, headers = {}) {
          statusCode = code;
          if (headers && typeof headers === 'object') {
            for (const [key, val] of Object.entries(headers)) {
              responseHeaders[key] = val;
            }
          }
          return this;
        },
        setHeader(key, val) {
          responseHeaders[key] = val;
          return this;
        },
        getHeader(key) {
          return responseHeaders[key] || responseHeaders[key.toLowerCase()];
        },
        write(chunk) {
          if (chunk) {
            responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return true;
        },
        end(chunk) {
          if (chunk) {
            responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const finalBody = Buffer.concat(responseChunks).toString('utf8');
          resolve({
            statusCode,
            headers: responseHeaders,
            body: finalBody,
          });
        },
      };

      // 4. Delegate to the backend API handler
      apiHandler(req, res).catch((err) => {
        console.error('Unhandled API handler exception in Netlify Function:', err);
        resolve({
          statusCode: err?.status || 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: err?.message || 'Internal server error' }),
        });
      });
    } catch (outerErr) {
      console.error('Fatal Netlify Function invocation error:', outerErr);
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Function execution error', message: outerErr.message }),
      });
    }
  });
}
