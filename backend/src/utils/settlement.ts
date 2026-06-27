import { Member, Payment, Settlement } from '../types';

/**
 * 最少送金回数アルゴリズム（greedy / two-pointer）
 * 各メンバーの純負担額を計算し、債権者・債務者をそれぞれ降順ソートして
 * 最大同士をマッチングすることで送金回数を最小化する。
 */
export function calculateSettlements(members: Member[], payments: Payment[]): Settlement[] {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const balance = new Map<string, number>(members.map((m) => [m.id, 0]));

  for (const payment of payments) {
    const perPerson = payment.netAmount / members.length;
    balance.set(payment.memberId, (balance.get(payment.memberId) ?? 0) + payment.netAmount);
    for (const member of members) {
      balance.set(member.id, (balance.get(member.id) ?? 0) - perPerson);
    }
  }

  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, amount] of balance) {
    if (amount > 0.5) creditors.push({ id, amount });
    else if (amount < -0.5) debtors.push({ id, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const transfer = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      fromMemberId: debtor.id,
      fromMemberName: memberMap.get(debtor.id) ?? debtor.id,
      toMemberId: creditor.id,
      toMemberName: memberMap.get(creditor.id) ?? creditor.id,
      amount: Math.round(transfer),
    });

    creditor.amount -= transfer;
    debtor.amount -= transfer;
    if (creditor.amount < 0.5) creditors.shift();
    if (debtor.amount < 0.5) debtors.shift();
  }

  return settlements;
}
