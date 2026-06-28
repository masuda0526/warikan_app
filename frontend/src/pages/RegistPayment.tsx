import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import type { GroupWithPayments, Exclusion } from '../types';

export default function RegistPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupWithPayments | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  // form state
  const [memberId, setMemberId] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [exclDesc, setExclDesc] = useState('');
  const [exclAmount, setExclAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getGroup(id)
      .then((g) => {
        setGroup(g);
        setMemberId(g.members[0]?.id ?? '');
      })
      .catch(() => setLoadError('グループの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [id]);

  const exclusionTotal = exclusions.reduce((sum, e) => sum + e.amount, 0);
  const netAmount = Number(totalAmount || 0) - exclusionTotal;

  const addExclusion = () => {
    const amt = Number(exclAmount);
    if (!exclDesc.trim() || !amt || amt <= 0) return;
    setExclusions((prev) => [...prev, { description: exclDesc.trim(), amount: amt }]);
    setExclDesc('');
    setExclAmount('');
  };

  const removeExclusion = (index: number) =>
    setExclusions((prev) => prev.filter((_, i) => i !== index));

  const handleDeletePayment = async (paymentId: string, label: string) => {
    if (!window.confirm(`「${label}」を削除しますか？\nこの操作は取り消せません。`)) return;
    setDeletingId(paymentId);
    try {
      await api.deletePayment(id!, paymentId);
      const updated = await api.getGroup(id!);
      setGroup(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalAmount);
    if (!memberId || !total || total <= 0) {
      setFormError('支払者と金額を入力してください');
      return;
    }
    if (netAmount < 0) {
      setFormError('除外金額の合計が支払金額を超えています');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.addPayment(id!, { memberId, description, totalAmount: total, exclusions });
      const updated = await api.getGroup(id!);
      setGroup(updated);
      // フォームリセット
      setDescription('');
      setTotalAmount('');
      setExclusions([]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="page"><p>読み込み中...</p></div></Layout>;
  if (loadError || !group) {
    return (
      <Layout>
        <div className="page"><p className="error">{loadError || 'グループが見つかりません'}</p></div>
      </Layout>
    );
  }

  const memberName = (mid: string) => group.members.find((m) => m.id === mid)?.name ?? mid;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Layout>
      <div className="page">
        {/* 支払い入力フォーム */}
        <div className="card">
          <div className="card-title-row">
            <h2>{group.name} — 支払いを追加</h2>
            <button type="button" className="btn-copy" onClick={copyLink}>
              {copied ? 'コピーしました！' : 'リンクをコピー'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>支払った人</label>
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>内容（任意）</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 居酒屋代"
              />
            </div>

            <div className="field">
              <label>支払金額（円）</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                min={0}
                placeholder="例: 10000"
              />
            </div>

            <div className="field">
              <label>除外金額を追加（割り勘対象外の項目）</label>
              <div className="row-input">
                <input
                  type="text"
                  value={exclDesc}
                  onChange={(e) => setExclDesc(e.target.value)}
                  placeholder="内容（例: 田中の一人飲み分）"
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  value={exclAmount}
                  onChange={(e) => setExclAmount(e.target.value)}
                  placeholder="金額"
                  min={0}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-secondary" onClick={addExclusion}>
                  追加
                </button>
              </div>
            </div>

            {exclusions.length > 0 && (
              <ul className="exclusion-list">
                {exclusions.map((e, i) => (
                  <li key={i}>
                    <span className="excl-desc">{e.description}</span>
                    <span className="excl-amount">−{e.amount.toLocaleString()}円</span>
                    <button type="button" className="btn-danger" onClick={() => removeExclusion(i)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="net-amount-row">
              <span className="label">割り勘対象金額</span>
              <span className="value">{netAmount.toLocaleString()}円</span>
            </div>

            {formError && <p className="error">{formError}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '登録中...' : '支払いを登録'}
            </button>
          </form>
        </div>

        {/* 登録済み支払い一覧 */}
        {group.payments.length > 0 && (
          <div className="card">
            <h3>登録済みの支払い（{group.payments.length}件）</h3>
            <ul className="payment-list">
              {group.payments.map((p) => {
                const label = p.description || `${memberName(p.memberId)} ${p.netAmount.toLocaleString()}円`;
                return (
                  <li key={p.paymentId}>
                    <div className="payment-main">
                      <span className="payment-desc">{p.description || '（内容なし）'}</span>
                      <span className="payment-amount">{p.netAmount.toLocaleString()}円</span>
                      <button
                        type="button"
                        className="btn-danger"
                        title="削除"
                        disabled={deletingId === p.paymentId}
                        onClick={() => handleDeletePayment(p.paymentId, label)}
                      >
                        {deletingId === p.paymentId ? '…' : '🗑'}
                      </button>
                    </div>
                    <span className="payment-payer">{memberName(p.memberId)} が支払い</span>
                    {p.exclusions.length > 0 && (
                      <span className="payment-excl">
                        除外: {p.exclusions.map((e) => `${e.description} ${e.amount.toLocaleString()}円`).join(' / ')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <button className="btn-success" onClick={() => navigate(`/result/${id}`)}>
              精算結果を見る →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
