// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TermsOfService from './TermsOfService';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isForgotPassword) {
      // パスワードリセット処理
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setMessage('パスワードリセット用のメールを送信しました。メールをご確認ください。');
      } catch (error) {
        setMessage('エラー: ' + error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 新規登録時の利用規約同意チェック
    if (isSignUp && !agreeToTerms) {
      setMessage('利用規約に同意してください。');
      setLoading(false);
      return;
    }

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) throw error;

      if (isSignUp) {
        setMessage('確認メールを送信しました。メールをチェックしてください。');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      
      <div className="auth-form">
        <h2>
          {isForgotPassword 
            ? 'パスワードリセット' 
            : (isSignUp ? 'アカウント作成' : 'ログイン')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="example@email.com"
            />
          </div>
          
          {!isForgotPassword && (
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="6文字以上"
                minLength={6}
              />
            </div>
          )}
          
          {isSignUp && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={loading}
                />
                <span>
                  <button 
                    type="button" 
                    className="btn-text-link"
                    onClick={() => setShowTerms(true)}
                  >
                    利用規約
                  </button>
                  に同意する
                </span>
              </label>
            </div>
          )}
          
          {message && (
            <div className={`message ${message.includes('エラー') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading 
              ? '処理中...' 
              : (isForgotPassword 
                  ? 'リセットメールを送信' 
                  : (isSignUp ? 'アカウント作成' : 'ログイン'))}
          </button>
        </form>
        
        {!isForgotPassword && (
          <p className="auth-switch">
            {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない方は'}
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="btn-text-primary"
              disabled={loading}
            >
              {isSignUp ? 'ログイン' : 'アカウント作成'}
            </button>
          </p>
        )}
        
        <p className="auth-switch">
          {isForgotPassword ? (
            <>
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage('');
                }}
                className="btn-text-primary"
                disabled={loading}
              >
                ログインに戻る
              </button>
            </>
          ) : (
            <>
              パスワードをお忘れですか？
              <button 
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setPassword('');
                  setMessage('');
                }}
                className="btn-text-primary"
                disabled={loading}
              >
                パスワードリセット
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;