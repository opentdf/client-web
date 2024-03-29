// Simplest HTTP server that supports RANGE headers AFAIK.
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import NodePath from 'node:path';
import send from 'send';

export async function serve(path, port) {
  const stats = await stat(path);
  const folder = !!stats?.isDirectory();
  const singleFile = !!stats?.isFile();
  if (!folder && !singleFile) {
    throw new Error('CRITICAL', `Path parameter not valid: [${file}]`);
  }

  console.log(`Listening on port ${port}; serving up ${folder ? 'file' : 'bit'}s from ${path}`);
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    if (req.headers?.origin) {
      res.setHeader('Access-Control-Allow-Headers', req.headers.origin);
    }
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
    const url = new URL(req.url, `http://${req.headers.host}`);
    const validNamePart = NodePath.basename(url.pathname);
    const allowedName = `/${validNamePart}`;
    if (allowedName !== url.pathname) {
      console.log(`[${url}].pathname (${url.pathname}) != [${allowedName}]`);
      res.writeHead(404);
      res.end();
      return;
    }
    const localPath = folder ? `${path}${allowedName}` : path;
    console.log(`Processing ${req.method} [${url}], maybe serve [${localPath}]`);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.writeHead(200);
      res.end();
      return;
    }
    send(req, localPath).pipe(res);
  });
  return server.listen(port);
}
