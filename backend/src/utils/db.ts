import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const GROUPS_TABLE = process.env.GROUPS_TABLE ?? 'warikan-groups';
export const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE ?? 'warikan-payments';
export const PAYMENTS_GSI = process.env.PAYMENTS_GSI ?? 'groupId-index';
