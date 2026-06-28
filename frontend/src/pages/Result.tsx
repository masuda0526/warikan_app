import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import type { GroupWithPayments, SettleResult } from '../types';

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupWithPayments | null>(null);
  const [result, setResult] = useState<SettleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .getGroup(id)
      .then(setGroup)
      .catch(() => setError('グループの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSettle = async () => {
    if (!id) return;
    setSettling(true);
    setError('');
    try {
      const res = await api.settle(id);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '精算に失敗しました');
    } finally {
      setSettling(false);
    }
  };

  if (loading) return <Layout><div className="page"><p>読み込み中...</p></div></Layout>;
  if (error && !group) return <Layout><div className="page"><p className="error">{error}</p></div></Layout>;
  if (!group) return <Layout><div className="page"><p className="error">グループが見つかりません</p></div></Layout>;

  const [copied, setCopied] = useState(false);

  const memberName = (mid: string) => group.members.find((m) => m.id === mid)?.name ?? mid;
  const totalNet = group.payments.reduce((sum, p) => sum + p.netAmount, 0);
  const perPerson = group.members.length > 0 ? Math.round(totalNet / group.members.length) : 0;

  const buildCopyText = (settleResult: SettleResult) => {
    const now = new Date().toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    const lines: string[] = [];

    lines.push(`【割り勘メモ】${group.name}`);
    lines.push('─────────────');
    lines.push(`メンバー: ${group.members.map((m) => m.name).join('、')}`);
    lines.push(`合計: ${totalNet.toLocaleString()}円`);
    lines.push(`一人あたり: ${perPerson.toLocaleString()}円`);
    lines.push('');

    lines.push('■ 精算内容');
    if (settleResult.settlements.length === 0) {
      lines.push('精算不要（均等に支払い済み）');
    } else {
      for (const s of settleResult.settlements) {
        lines.push(`${s.fromMemberName} → ${s.toMemberName}  ${s.amount.toLocaleString()}円`);
      }
    }
    lines.push('');

    lines.push('■ 支払い明細');
    for (const p of group.payments) {
      const desc = p.description || '（内容なし）';
      lines.push(`・${desc}  ${p.netAmount.toLocaleString()}円`);
      lines.push(`  ${memberName(p.memberId)} が支払い`);
      if (p.exclusions.length > 0) {
        for (const e of p.exclusions) {
          lines.push(`  除外: ${e.description} ${e.amount.toLocaleString()}円`);
        }
      }
    }
    lines.push('');

    lines.push(`${now} 生成`);
    return lines.join('\n');
  };

  const copyResult = (settleResult: SettleResult) => {
    navigator.clipboard.writeText(buildCopyText(settleResult)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Layout>
      <div className="page">
        {/* 精算セクション */}
        <div className="card">
          <h2>{group.name} — 精算結果</h2>
          <div className="summary-row">
            メンバー: {group.members.map((m) => m.name).join('、')}
            <br />
            合計支払額: {totalNet.toLocaleString()}円 &nbsp;/&nbsp; 一人あたり: {perPerson.toLocaleString()}円
          </div>

          {group.payments.length === 0 ? (
            <p className="error">支払いが登録されていません</p>
          ) : result ? (
            <>
              {result.settlements.length === 0 ? (
                <p className="settle-done">精算不要です（全員が均等に支払い済み）</p>
              ) : (
                <ul className="settlement-list">
                  {result.settlements.map((s, i) => (
                    <li key={i}>
                      <strong>{s.fromMemberName}</strong>
                      <span className="settle-arrow">→</span>
                      <strong>{s.toMemberName}</strong>
                      <span className="settle-amount">{s.amount.toLocaleString()}円</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn-copy-result" onClick={() => copyResult(result)}>
                {copied ? 'コピーしました！' : '精算メモをコピー（LINE共有用）'}
              </button>
            </>
          ) : (
            <>
              {error && <p className="error">{error}</p>}
              <button className="btn-success" onClick={handleSettle} disabled={settling}>
                {settling ? '計算中...' : '精算を計算する（最少送金回数）'}
              </button>
            </>
          )}
        </div>

        {/* 支払い詳細 */}
        {group.payments.length > 0 && (
          <div className="card">
            <h3>支払い詳細</h3>
            <ul className="payment-list">
              {group.payments.map((p) => (
                <li key={p.paymentId}>
                  <div className="payment-main">
                    <span className="payment-desc">{p.description || '（内容なし）'}</span>
                    <span className="payment-amount">{p.netAmount.toLocaleString()}円</span>
                  </div>
                  <span className="payment-payer">{memberName(p.memberId)} が支払い</span>
                  {p.exclusions.length > 0 && (
                    <span className="payment-excl">
                      除外: {p.exclusions.map((e) => `${e.description} ${e.amount.toLocaleString()}円`).join(' / ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-actions">
          <button className="btn-secondary" onClick={() => navigate(`/regist-payment/${id}`)}>
            ← 支払いを追加
          </button>
        </div>
      </div>
    </Layout>
  );
}
