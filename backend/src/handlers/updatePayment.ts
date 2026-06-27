import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, GROUPS_TABLE, PAYMENTS_TABLE } from '../utils/db';
import { response } from '../utils/response';
import { Exclusion, Payment } from '../types';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { id: groupId, paymentId } = event.pathParameters ?? {};
  if (!groupId || !paymentId) {
    return response(400, { success: false, error: 'groupId と paymentId が必要です' });
  }

  const [groupRes, paymentRes] = await Promise.all([
    ddb.send(new GetCommand({ TableName: GROUPS_TABLE, Key: { groupId } })),
    ddb.send(new GetCommand({ TableName: PAYMENTS_TABLE, Key: { paymentId } })),
  ]);

  if (!groupRes.Item) return response(404, { success: false, error: 'グループが見つかりません' });
  const current = paymentRes.Item as Payment | undefined;
  if (!current || current.groupId !== groupId) {
    return response(404, { success: false, error: '支払いが見つかりません' });
  }

  const body = JSON.parse(event.body ?? '{}') as {
    memberId?: string;
    description?: string;
    totalAmount?: number;
    exclusions?: Exclusion[];
  };

  const newTotal = body.totalAmount !== undefined ? Number(body.totalAmount) : current.totalAmount;
  const newExclusions: Exclusion[] = body.exclusions ?? current.exclusions;
  const exclusionTotal = newExclusions.reduce((sum, e) => sum + e.amount, 0);
  const newNetAmount = newTotal - exclusionTotal;

  if (newNetAmount < 0) {
    return response(400, { success: false, error: '除外金額の合計が支払金額を超えています' });
  }

  const res = await ddb.send(
    new UpdateCommand({
      TableName: PAYMENTS_TABLE,
      Key: { paymentId },
      UpdateExpression:
        'SET memberId = :mid, description = :desc, totalAmount = :total, exclusions = :excl, netAmount = :net',
      ExpressionAttributeValues: {
        ':mid': body.memberId ?? current.memberId,
        ':desc': body.description?.trim() ?? current.description,
        ':total': newTotal,
        ':excl': newExclusions,
        ':net': newNetAmount,
      },
      ReturnValues: 'ALL_NEW',
    }),
  );

  return response(200, { success: true, data: res.Attributes as Payment });
};
