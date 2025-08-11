import React from 'react';

const DevAuth = ({ onUseTestAccount }) => {
  // 開発環境でのみ表示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#fffbeb',
      border: '1px solid #fbbf24',
      borderRadius: '4px',
      marginBottom: '15px'
    }}>
      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px' }}>
        🔧 開発環境用クイックログイン
      </div>
      <button
        onClick={onUseTestAccount}
        style={{
          padding: '5px 10px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        テストアカウントを使用
      </button>
      <div style={{ fontSize: '11px', color: '#78716c', marginTop: '5px' }}>
        Email: test@camping-car.com / Pass: test123456
      </div>
    </div>
  );
};

export default DevAuth;
