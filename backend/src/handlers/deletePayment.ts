import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, PAYMENTS_TABLE } from '../utils/db';
import { response } from '../utils/response';
import { Payment } from '../types';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const { id: groupId, paymentId } = event.pathParameters ?? {};
  if (!groupId || !paymentId) {
    return response(400, { success: false, error: 'groupId と paymentId が必要です' });
  }

  const paymentRes = await ddb.send(
    new GetCommand({ TableName: PAYMENTS_TABLE, Key: { paymentId } }),
  );
  const payment = paymentRes.Item as Payment | undefined;

  if (!payment || payment.groupId !== groupId) {
    return response(404, { success: false, error: '支払いが見つかりません' });
  }

  await ddb.send(new DeleteCommand({ TableName: PAYMENTS_TABLE, Key: { paymentId } }));
  return response(200, { success: true, data: { paymentId } });
};
