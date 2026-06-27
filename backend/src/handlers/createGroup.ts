import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, GROUPS_TABLE } from '../utils/db';
import { response } from '../utils/response';
import { Group } from '../types';

const TTL_DAYS = 90;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const body = JSON.parse(event.body ?? '{}') as { name?: string; members?: string[] };

  if (!body.name?.trim() || !Array.isArray(body.members) || body.members.length < 2) {
    return response(400, { success: false, error: 'name と 2人以上の members が必要です' });
  }

  const group: Group = {
    groupId: crypto.randomUUID(),
    name: body.name.trim(),
    members: body.members.map((m) => ({ id: crypto.randomUUID(), name: String(m).trim() })),
    status: 'active',
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * TTL_DAYS,
    createdAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: GROUPS_TABLE, Item: group }));
  return response(201, { success: true, data: group });
};
