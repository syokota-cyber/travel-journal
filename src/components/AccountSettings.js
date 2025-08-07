import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('確認テキストが正しくありません。');
      return;
    }

    setLoading(true);
    try {
      // 関連データの削除（カスケード削除の順序を考慮）
      // 1. trip_rule_confirmations（trip_idに依存）
      const trips = await supabase
        .from('trips')
        .select('id')
        .eq('user_id', user.id);
      
      if (trips.data && trips.data.length > 0) {
        const tripIds = trips.data.map(t => t.id);
        
        // trip関連のテーブルを削除
        await supabase.from('trip_rule_confirmations').delete().in('trip_id', tripIds);
        await supabase.from('trip_reviews').delete().in('trip_id', tripIds);
        await supabase.from('trip_items').delete().in('trip_id', tripIds);
        await supabase.from('trip_purposes').delete().in('trip_id', tripIds);
      }
      
      // 2. trips（user_idに依存）
      await supabase.from('trips').delete().eq('user_id', user.id);
      
      // 3. メタデータを更新してアカウントを無効化
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        }
      });
      
      if (updateError) {
        console.error('アカウント無効化エラー:', updateError);
      }
      
      // サインアウト
      await signOut();
      
      alert('アカウントデータが削除されました。');
      
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      alert('アカウントの削除に失敗しました。サポートにお問い合わせください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content account-settings">
        <button 
          className="modal-close" 
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        
        <h2>アカウント設定</h2>
        
        <div className="settings-section">
          <h3>アカウント情報</h3>
          <p>メールアドレス: {user?.email}</p>
          <p>ユーザーID: {user?.id}</p>
        </div>
        
        <div className="settings-section danger-zone">
          <h3>危険ゾーン</h3>
          
          {!showDeleteConfirm ? (
            <button 
              className="btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              アカウントを削除
            </button>
          ) : (
            <div className="delete-confirm-section">
              <p className="warning-text">
                ⚠️ この操作は取り消せません。すべてのデータが完全に削除されます。
              </p>
              <p>
                本当にアカウントを削除する場合は、下のテキストボックスに <strong>DELETE</strong> と入力してください。
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE と入力"
                className="delete-confirm-input"
                disabled={loading}
              />
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || loading}
                >
                  {loading ? '削除中...' : 'アカウントを完全に削除'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;