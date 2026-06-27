import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiResponse } from '../types';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

export function response<T>(statusCode: number, body: ApiResponse<T>): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    },
    body: JSON.stringify(body),
  };
}
