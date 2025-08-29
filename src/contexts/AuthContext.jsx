import React, { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase'; // 一時的にSupabase無効

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // デモモード: 自動的にデモユーザーでログイン
  const [user, setUser] = useState({
    id: 'demo-user',
    email: 'demo@example.com',
    user_metadata: { name: 'デモユーザー' }
  });
  const [loading, setLoading] = useState(false); // 即座にロード完了
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    // デモモードでは即座にロード完了
    setLoading(false);
    console.log('🎯 デモモードでログイン済み');
  }, []);

  // デモ用認証関数（実際の認証は行わない）
  const signUp = async (email, password) => {
    console.log('🎯 デモモード: サインアップ無効');
    return { data: null, error: null };
  };

  const signIn = async (email, password) => {
    console.log('🎯 デモモード: サインイン無効');
    return { data: null, error: null };
  };

  const signOut = async () => {
    console.log('🎯 デモモード: サインアウト無効');
    return { error: null };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    confirmationMessage,
    setConfirmationMessage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};