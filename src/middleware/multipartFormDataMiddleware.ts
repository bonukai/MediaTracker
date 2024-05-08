import { RequestHandler, Request } from 'express';
import {
  parseContentTypeHeader,
  parseMultipartFormData,
} from '../multipartFormDataParser.js';

export const multipartFormDataMiddleware: RequestHandler = async (
  req,
  res,
  next
) => {
  const contentTypeHeader = req.headers['content-type'];

  if (typeof contentTypeHeader === 'string') {
    const parsedHeader = parseContentTypeHeader(contentTypeHeader);

    if (parsedHeader.contentType === 'multipart/form-data') {
      const boundary = parsedHeader.data.boundary;

      if (typeof boundary !== 'string') {
        throw new Error(
          `missing boundary value in header "${contentTypeHeader}"`
        );
      }

      const body = await consumePayload(req);

      req.body = parseMultipartFormData({ boundary, body });
    }
  }

  next();
};

const consumePayload = async (req: Request) => {
  return new Promise<string>((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      if (Buffer.isBuffer(chunk)) {
        data += chunk.toString('utf-8');
      } else if (typeof chunk === 'string') {
        data += chunk;
      } else {
        throw new Error(`unexpected data type ${chunk}`);
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};
