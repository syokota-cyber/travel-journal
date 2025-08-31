import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TermsOfService from './TermsOfService';
import DevAuth from './DevAuth';
import Footer from './Footer';
import { validateEmail, validatePassword } from '../utils/validation';
import { handleAuthError } from '../utils/errorHandler';
import { supabase, getRedirectURL } from '../lib/supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // デフォルトのテストアカウント設定
  const [useTestAccount, setUseTestAccount] = useState(false);

  const { signUp, signIn, confirmationMessage, setConfirmationMessage } = useAuth();
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  useEffect(() => {
    if (confirmationMessage) {
      setMessage(confirmationMessage);
      setConfirmationMessage(''); // メッセージをクリア
    }
  }, [confirmationMessage, setConfirmationMessage]);

  // テストアカウントの入力
  const useTestAccountData = () => {
    // 実在するメールアドレスを使用するか、環境変数から取得
    const testEmail = process.env.REACT_APP_TEST_EMAIL || 'shin1yokota@gmail.com';
    setEmail(testEmail);
    setPassword('test123456');
    setUseTestAccount(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // メールアドレスの検証
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setMessage(emailValidation.error);
      setLoading(false);
      return;
    }

    if (isForgotPassword) {
      // パスワードリセット処理
      try {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.value, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setMessage('パスワードリセット用のメールを送信しました。メールをご確認ください。');
      } catch (error) {
        const result = handleAuthError(error);
        setMessage(result.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // パスワードの検証（新規登録時のみ）
    if (isSignUp) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setMessage(`パスワードが弱いです: ${passwordValidation.error}`);
        setLoading(false);
        return;
      }
    }

    // 新規登録時の利用規約同意チェック
    if (isSignUp && !agreeToTerms && !useTestAccount) {
      setMessage('利用規約に同意してください。');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = isSignUp 
        ? await signUp(emailValidation.value, password)
        : await signIn(emailValidation.value, password);

      console.log('🔐 認証結果:', { data, error });

      if (error) {
        console.error('🔴 認証エラー詳細:', {
          message: error.message,
          status: error.status,
          details: error,
        });
        
        if (error.message.includes('Invalid login credentials')) {
          if (isSignUp) {
            throw error;
          } else {
            setMessage('ログイン情報が正しくありません。新規アカウントを作成するか、メールアドレスとパスワードを確認してください。');
            setLoading(false);
            return;
          }
        }
        throw error;
      }

      if (isSignUp) {
        // メール確認が必要な場合
        if (data?.user?.identities?.length === 0) {
          setEmailConfirmationSent(true);
          setMessage('確認メールを送信しました！メール内のリンクをクリックして、アカウントを有効化してください。');
        } else if (useTestAccount) {
          setMessage('テストアカウントが作成されました！ログインタブに切り替えてログインしてください。');
          setTimeout(() => {
            setIsSignUp(false);
            setMessage('作成したアカウントでログインしてください。');
          }, 2000);
        } else {
          setMessage('アカウントが作成されました！確認メールをご確認ください。');
          setEmailConfirmationSent(true);
        }
      } else {
        setMessage('ログインに成功しました！');
      }
    } catch (error) {
      console.error('🚨 認証エラー:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        setMessage('ログイン情報が正しくありません。アカウントが存在しない可能性があります。新規登録を試してください。');
      } else if (error.message.includes('Email not confirmed')) {
        setMessage('開発環境：メール確認をスキップしてログインを試行中...');
        
        // 開発環境では強制的にログインを試行
        try {
          // メール確認バイパス試行（機密情報のためログ削除）
          
          // メール確認をスキップする代替ログイン方法
          const { supabase } = await import('../lib/supabase');
          
          // 再度ログインを試行（場合によっては成功する）
          setTimeout(async () => {
            try {
              const retryResult = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (retryResult.error) {
                setMessage('メール確認が必要です。新しいアカウントを作成してください。テストアカウントボタンを使用することをお勧めします。');
              } else {
                setMessage('ログインに成功しました！');
              }
            } catch (retryError) {
              setMessage('メール確認が必要です。新しいアカウントを作成してください。テストアカウントボタンを使用することをお勧めします。');
            }
            setLoading(false);
          }, 1000);
          
          return; // この場合はここで終了
        } catch (bypassError) {
          setMessage('メール確認が必要です。新しいアカウントを作成してください。テストアカウントボタンを使用することをお勧めします。');
        }
      } else if (error.message.includes('User already registered')) {
        setMessage('このメールアドレスは既に登録されています。ログインを試してください。');
      } else {
        setMessage(`エラー: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectURL(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
      
      setMessage('Googleアカウントでログイン中...');
    } catch (error) {
      console.error('Google OAuth error:', error);
      setMessage(`Googleログインエラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // メール確認の再送信
  const resendConfirmationEmail = async () => {
    if (!email) {
      setMessage('メールアドレスを入力してください。');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      setMessage('確認メールを再送信しました。メールをご確認ください。');
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🚐 キャンピングカー旅行手帳</h2>
        <p className="auth-subtitle">あなたの旅の記録を大切に保存</p>
        
        {!isForgotPassword ? (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={!isSignUp ? 'active' : ''}
                onClick={() => {
                  setIsSignUp(false);
                  setMessage('');
                }}
              >
                ログイン
              </button>
              <button
                type="button"
                className={isSignUp ? 'active' : ''}
                onClick={() => {
                  setIsSignUp(true);
                  setMessage('');
                }}
              >
                新規登録
              </button>
            </div>

            {/* Googleログインボタン */}
            <div className="oauth-section">
              <div className="divider" style={{
                textAlign: 'center',
                position: 'relative',
                margin: '20px 0',
                color: '#666'
              }}>
                <span style={{
                  backgroundColor: '#fff',
                  padding: '0 10px',
                  position: 'relative',
                  zIndex: 1
                }}>または</span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: '#e0e0e0',
                  zIndex: 0
                }}></div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="btn-google"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  color: '#3c4043',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  marginTop: '16px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f8f8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                  <path fill="#4285F4" d="M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3a8.8 8.8 0 0 0 2.6-6.6z"/>
                  <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z"/>
                  <path fill="#FBBC05" d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z"/>
                  <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4a5.4 5.4 0 0 1 5-3.7z"/>
                  <path fill="none" d="M0 0h18v18H0z"/>
                </svg>
                Googleでログイン
              </button>
            </div>

            {/* テストアカウント簡単ボタン（開発環境のみ表示） */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #e1f5fe' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>🧪 テスト用</h4>
                <button
                  type="button"
                  onClick={useTestAccountData}
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  テストアカウント情報を入力
                </button>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                  test@camping-car.com / test123456
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="forgot-password-header">
            <h3>パスワードリセット</h3>
            <p>メールアドレスを入力してください</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your-email@example.com"
              disabled={loading}
            />
          </div>

          {!isForgotPassword && (
            <div className="form-group">
              <label htmlFor="password">
                パスワード
                {isSignUp && <span className="required"> (6文字以上)</span>}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 6 : undefined}
                placeholder={isSignUp ? "6文字以上のパスワード" : "パスワード"}
                disabled={loading}
              />
            </div>
          )}

          {isSignUp && !useTestAccount && (
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                />
                <span>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={() => setShowTerms(true)}
                  >
                    利用規約
                  </button>
                  に同意します
                </span>
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="loading-spinner">処理中...</span>
            ) : isForgotPassword ? (
              'リセットメールを送信'
            ) : isSignUp ? (
              'アカウント作成'
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('エラー') || message.includes('正しくありません') ? 'error' : 'success'}`}>
            {message}
            {emailConfirmationSent && !message.includes('エラー') && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={resendConfirmationEmail}
                  disabled={loading}
                  className="btn-text-link"
                  style={{ fontSize: '14px' }}
                >
                  確認メールを再送信
                </button>
              </div>
            )}
          </div>
        )}

        {!isForgotPassword && (
          <div className="auth-links">
            <button
              type="button"
              className="btn-text-link"
              onClick={() => {
                setIsForgotPassword(true);
                setMessage('');
              }}
            >
              パスワードを忘れた場合
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className="auth-links">
            <button
              type="button"
              className="btn-text-link"
              onClick={() => {
                setIsForgotPassword(false);
                setMessage('');
              }}
            >
              ← ログインに戻る
            </button>
          </div>
        )}
        
        <Footer />
      </div>

      {showTerms && (
        <TermsOfService onClose={() => setShowTerms(false)} />
      )}

      {/* 開発者ツール：メール確認エラー対応（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <DevAuth onUseTestAccount={useTestAccountData} />
      )}
    </div>
  );
};

export default Auth;
