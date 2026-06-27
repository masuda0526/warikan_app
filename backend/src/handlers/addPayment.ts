import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, GROUPS_TABLE, PAYMENTS_TABLE } from '../utils/db';
import { response } from '../utils/response';
import { Payment, Exclusion } from '../types';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const groupId = event.pathParameters?.id;
  if (!groupId) return response(400, { success: false, error: 'groupId が必要です' });

  const groupRes = await ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } }));
  if (!groupRes.Item) return response(404, { success: false, error: 'グループが見つかりません' });

  const body = JSON.parse(event.body ?? '{}') as {
    memberId?: string;
    description?: string;
    totalAmount?: number;
    exclusions?: Exclusion[];
  };

  if (!body.memberId || body.totalAmount == null || body.totalAmount <= 0) {
    return response(400, { success: false, error: 'memberId と totalAmount（正の数）が必要です' });
  }

  const exclusions: Exclusion[] = body.exclusions ?? [];
  const exclusionTotal = exclusions.reduce((sum, e) => sum + e.amount, 0);
  const netAmount = Number(body.totalAmount) - exclusionTotal;

  if (netAmount < 0) {
    return response(400, { success: false, error: '除外金額の合計が支払金額を超えています' });
  }

  const payment: Payment = {
    paymentId: crypto.randomUUID(),
    groupId,
    memberId: body.memberId,
    description: body.description?.trim() ?? '',
    totalAmount: Number(body.totalAmount),
    exclusions,
    netAmount,
  };

  await ddb.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: payment }));
  return response(201, { success: true, data: payment });
};
