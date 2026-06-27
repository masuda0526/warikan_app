import { useNavigate } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <>
      <header className="app-header" onClick={() => navigate('/create')}>
        割り勘アプリ
      </header>
      {children}
    </>
  );
}
