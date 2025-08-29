import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// 管理者メールアドレス（環境変数から取得可能にする）
const ADMIN_EMAILS = [
  'shin1yokota@gmail.com'
];

function AdminRoute({ children }) {
  const { user } = useAuth();
  
  // 管理者チェック
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto'
      }}>
        <h2>アクセス権限がありません</h2>
        <p style={{ color: '#666', marginTop: '20px' }}>
          この画面は管理者のみアクセス可能です。
        </p>
        <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
          ログインユーザー: {user?.email || '未ログイン'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminRoute;