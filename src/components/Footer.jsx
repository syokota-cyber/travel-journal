import React, { useState } from 'react';

function Footer() {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);

  return (
    <>
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => setShowGuideModal(true)}
            >
              📖 使い方ガイド
            </button>
            <span className="footer-separator">|</span>
            <button 
              className="footer-link"
              onClick={() => setShowBugReportModal(true)}
            >
              📧 不具合の報告
            </button>
          </div>
          <div className="footer-copyright">
            © 2025 Campingcar Travel Tips.com
          </div>
        </div>
      </footer>

      {/* 使い方ガイドモーダル */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowGuideModal(false)}>×</button>
            <h2>📖 使い方ガイド</h2>
            
            <div className="guide-section">
              <h3>基本機能</h3>
              <ul>
                <li><strong>旅行計画作成</strong>: 月2件まで、年間24件まで作成可能</li>
                <li><strong>目的設定</strong>: メイン目的とサブ目的を選択</li>
                <li><strong>カスタムサブ目的</strong>: 最大3つまで独自の目的を追加可能</li>
                <li><strong>持ち物リスト</strong>: カスタム持ち物も最大3つまで追加可能</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>制限事項</h3>
              <ul>
                <li>月間作成数: 2件まで</li>
                <li>年間作成数: 24件まで</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>便利な機能</h3>
              <ul>
                <li>日程の重複チェック</li>
                <li>旅行後のレビュー機能</li>
                <li>達成率の自動計算</li>
                <li>パーセント評価による振り返り</li>
                <li>データエクスポート機能（JSON・CSV形式）</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 不具合報告モーダル */}
      {showBugReportModal && (
        <div className="modal-overlay" onClick={() => setShowBugReportModal(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBugReportModal(false)}>×</button>
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

    </>
  );
}

export default Footer;