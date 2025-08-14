import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TermsOfService from './TermsOfService';

const AccountSettings = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [showTerms, setShowTerms] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

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

  const handleExportData = async () => {
    setExporting(true);
    try {
      // 1. ユーザーの全旅行データを取得
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id);

      if (tripsError) throw tripsError;

      // 2. 各旅行の詳細データを取得
      const tripsWithDetails = await Promise.all(
        trips.map(async (trip) => {
          // 旅行目的データ
          const { data: purposes } = await supabase
            .from('trip_purposes')
            .select(`
              *,
              main_purposes(name),
              sub_purposes(name)
            `)
            .eq('trip_id', trip.id);

          // 持ち物チェックリストデータ
          const { data: checklist } = await supabase
            .from('trip_checklists')
            .select('*')
            .eq('trip_id', trip.id);

          // レビューデータ
          const { data: reviews } = await supabase
            .from('trip_reviews')
            .select('*')
            .eq('trip_id', trip.id);

          return {
            ...trip,
            purposes: purposes || [],
            checklist: checklist || [],
            reviews: reviews || []
          };
        })
      );

      // 3. エクスポートデータ作成
      const exportData = {
        export_date: new Date().toISOString(),
        user_email: user.email,
        user_id: user.id,
        total_trips: tripsWithDetails.length,
        trips: tripsWithDetails
      };

      // 4. 形式に応じてファイル作成・ダウンロード
      if (exportFormat === 'json') {
        downloadJSON(exportData);
      } else {
        downloadCSV(tripsWithDetails);
      }

    } catch (error) {
      console.error('データエクスポートエラー:', error);
      alert('データのエクスポートに失敗しました。時間をおいて再試行してください。');
    } finally {
      setExporting(false);
    }
  };

  const downloadJSON = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-journal-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (trips) => {
    // CSVヘッダー
    const csvHeaders = [
      '旅行タイトル', '開始日', '終了日', '場所', 
      'メイン目的', 'サブ目的', 'カスタム目的',
      '持ち物アイテム', 'チェック済み', 
      '評価スコア', 'レビューコメント', '作成日'
    ];

    // CSVデータ行作成
    const csvRows = [];
    
    trips.forEach(trip => {
      const purposes = trip.purposes || [];
      const checklist = trip.checklist || [];
      const reviews = trip.reviews || [];

      // 目的データの整理
      const mainPurposes = purposes
        .filter(p => p.purpose_type === 'main')
        .map(p => p.main_purposes?.name || p.custom_purpose)
        .join('・');
      
      const subPurposes = purposes
        .filter(p => p.purpose_type === 'sub')
        .map(p => p.sub_purposes?.name || p.custom_purpose)
        .join('・');

      const customPurposes = purposes
        .filter(p => p.purpose_type === 'custom')
        .map(p => p.custom_purpose)
        .join('・');

      if (checklist.length > 0) {
        // 持ち物がある場合は持ち物ごとに行を作成
        checklist.forEach(item => {
          const row = [
            `"${trip.title || ''}"`,
            `"${trip.start_date || ''}"`,
            `"${trip.end_date || ''}"`,
            `"${trip.location || ''}"`,
            `"${mainPurposes}"`,
            `"${subPurposes}"`,
            `"${customPurposes}"`,
            `"${item.item_name || ''}"`,
            `"${item.is_checked ? '○' : '×'}"`,
            `"${reviews[0]?.total_score || ''}"`,
            `"${reviews[0]?.comment || ''}"`,
            `"${trip.created_at?.split('T')[0] || ''}"`
          ];
          csvRows.push(row.join(','));
        });
      } else {
        // 持ち物がない場合は旅行情報のみ
        const row = [
          `"${trip.title || ''}"`,
          `"${trip.start_date || ''}"`,
          `"${trip.end_date || ''}"`,
          `"${trip.location || ''}"`,
          `"${mainPurposes}"`,
          `"${subPurposes}"`,
          `"${customPurposes}"`,
          '""',
          '""',
          `"${reviews[0]?.total_score || ''}"`,
          `"${reviews[0]?.comment || ''}"`,
          `"${trip.created_at?.split('T')[0] || ''}"`
        ];
        csvRows.push(row.join(','));
      }
    });

    // CSV文字列作成
    const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // BOM付きでダウンロード（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-journal-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

        <div className="settings-section">
          <h3>データエクスポート</h3>
          <p>あなたの旅行データをバックアップとしてダウンロードできます。</p>
          
          <div className="export-format-selection">
            <label>
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={exporting}
              />
              <span>JSON形式 (完全データ・プログラム処理向け)</span>
            </label>
            <label>
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={exporting}
              />
              <span>CSV形式 (Excel・スプレッドシート向け)</span>
            </label>
          </div>

          <button 
            className="btn-primary export-btn"
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? 'エクスポート中...' : `${exportFormat.toUpperCase()}でエクスポート`}
          </button>
          
          <p className="export-note">
            💡 <strong>推奨:</strong> 月1回程度の定期的なエクスポートでデータを保護しましょう
          </p>
        </div>

        <div className="settings-section">
          <h3>利用規約</h3>
          <p>Travel Journalの利用規約をご確認いただけます。</p>
          <button 
            className="btn-secondary"
            onClick={() => setShowTerms(true)}
          >
            利用規約を表示
          </button>
        </div>

        <div className="settings-section">
          <h3>サポート・フィードバック</h3>
          <p>不具合の報告や機能改善のご提案がございましたら、お気軽にお知らせください。</p>
          <button 
            className="btn-secondary"
            onClick={() => setShowBugReport(true)}
          >
            🐛 不具合を報告・改善提案
          </button>
          <p className="support-note">
            💡 報告いただいた内容は今後の改善に活用させていただきます
          </p>
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
      
      {showTerms && (
        <TermsOfService onClose={() => setShowTerms(false)} />
      )}

      {showBugReport && (
        <div className="modal-overlay" onClick={() => setShowBugReport(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBugReport(false)}>×</button>
            <h2>🐛 不具合の報告・改善提案</h2>
            
            <div className="guide-section">
              <p>
                不具合の報告や機能改善のご提案がございましたら、以下のボタンからGoogleフォームにアクセスしてください。<br/>
                いただいた内容は今後の改善に活用させていただきます。
              </p>
              
              <div style={{textAlign: 'center', margin: '20px 0'}}>
                <button 
                  className="btn-primary"
                  onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSf3ixzjq-Z7GMHP1XJLtI2uY6nG1jxjlie0WQODjVfzh2KmUw/viewform', '_blank', 'noopener,noreferrer')}
                  style={{padding: '12px 24px', fontSize: '16px'}}
                >
                  📝 不具合報告フォームを開く
                </button>
              </div>
            </div>

            <div className="guide-section">
              <h3>📋 報告時にお伝えいただきたい情報</h3>
              <ul>
                <li><strong>発生した問題の詳細</strong>: どのような操作でエラーが発生したか</li>
                <li><strong>発生日時</strong>: いつ問題が起きたか</li>
                <li><strong>使用環境</strong>: 端末（PC/スマホ）・ブラウザの種類</li>
                <li><strong>エラーメッセージ</strong>: 表示された場合はその内容</li>
              </ul>
              <p>これらの情報をお知らせいただけると、問題解決がスムーズになります。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;