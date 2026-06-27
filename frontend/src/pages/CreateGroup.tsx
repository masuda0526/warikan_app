import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    const name = memberInput.trim();
    if (name && !members.includes(name)) setMembers((prev) => [...prev, name]);
    setMemberInput('');
  };

  const removeMember = (name: string) => setMembers((prev) => prev.filter((m) => m !== name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || members.length < 2) {
      setError('グループ名と2人以上のメンバーを入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const group = await api.createGroup(groupName.trim(), members);
      navigate(`/regist-payment/${group.groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page">
        <div className="card">
          <h2>グループを作成</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>グループ名</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例: 飲み会、旅行"
              />
            </div>

            <div className="field">
              <label>メンバーを追加</label>
              <div className="row-input">
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                  placeholder="名前を入力してEnter"
                />
                <button type="button" className="btn-secondary" onClick={addMember}>
                  追加
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <div className="tag-list">
                {members.map((m) => (
                  <span key={m} className="tag">
                    {m}
                    <button type="button" className="btn-danger" onClick={() => removeMember(m)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '作成中...' : 'グループを作成して支払い入力へ'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
