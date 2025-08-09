import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    // URLパラメータをチェック
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const error = params.get('error');
      const error_description = params.get('error_description');
      
      if (type === 'signup' && !error) {
        setConfirmationMessage('メールアドレスが確認されました！アプリに戻ってログインしてください。');
        // URLパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        if (error === 'access_denied' && error_description?.includes('Email link is invalid')) {
          setConfirmationMessage('確認リンクが無効または期限切れです。新しいリンクをリクエストしてください。');
        } else {
          setConfirmationMessage(`エラー: ${error_description || error}`);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkUrlParams();

    // 現在のセッションを取得
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // サインアップ
  const signUp = async (email, password) => {
    console.log('🔐 サインアップ試行:', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('🔴 サインアップエラー:', {
        message: error.message,
        status: error.status,
        details: error
      });
    } else {
      console.log('✅ サインアップ成功:', data);
    }
    
    return { data, error };
  };

  // サインイン
  const signIn = async (email, password) => {
    console.log('🔐 サインイン試行:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('🔴 サインインエラー:', {
        message: error.message,
        status: error.status,
        details: error
      });
    } else {
      console.log('✅ サインイン成功:', data);
    }
    
    return { data, error };
  };

  // サインアウト
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
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