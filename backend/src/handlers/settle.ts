import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, GROUPS_TABLE, PAYMENTS_TABLE, PAYMENTS_GSI } from '../utils/db';
import { response } from '../utils/response';
import { Group, Payment } from '../types';
import { calculateSettlements } from '../utils/settlement';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const groupId = event.pathParameters?.id;
  if (!groupId) return response(400, { success: false, error: 'groupId が必要です' });

  const [groupRes, paymentsRes] = await Promise.all([
    ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } })),
    ddb.send(
      new QueryCommand({
        TableName: PAYMENTS_TABLE,
        IndexName: PAYMENTS_GSI,
        KeyConditionExpression: 'groupId = :gid',
        ExpressionAttributeValues: { ':gid': groupId },
      }),
    ),
  ]);

  if (!groupRes.Item) return response(404, { success: false, error: 'グループが見つかりません' });

  const group = groupRes.Item as Group;
  const payments = (paymentsRes.Items ?? []) as Payment[];
  const settlements = calculateSettlements(group.members, payments);

  await ddb.send(
    new UpdateCommand({
      TableName: GROUPS_TABLE,
      Key: { groupId },
      UpdateExpression: 'SET #s = :settled',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':settled': 'settled' },
    }),
  );

  return response(200, { success: true, data: { settlements, group, payments } });
};
