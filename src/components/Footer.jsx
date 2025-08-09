import React, { useState } from 'react';

function Footer() {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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
              onClick={() => setShowContactModal(true)}
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
                <li><strong>旅行計画作成</strong>: 月2件まで、年間12件まで作成可能</li>
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
                <li>カスタムサブ目的: 3つまで</li>
                <li>カスタム持ち物: 3つまで</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>便利な機能</h3>
              <ul>
                <li>日程の重複チェック</li>
                <li>旅行後のレビュー機能</li>
                <li>達成率の自動計算</li>
                <li>星評価による振り返り</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 不具合の報告モーダル */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowContactModal(false)}>×</button>
            <h2>📧 不具合の報告</h2>
            
            <div className="contact-section">
              <h3>不具合・バグ報告</h3>
              <p>アプリの不具合、バグ、エラーなどを発見された場合は、以下のメールアドレスまでご報告ください。</p>
              
              <div className="contact-email">
                <strong>問い合わせ先:</strong>
                <a href="mailto:campingcartraveltips@gmail.com">
                  campingcartraveltips@gmail.com
                </a>
              </div>
              
              <div className="contact-tips">
                <h4>報告時のお願い</h4>
                <ul>
                  <li>発生した問題の詳細</li>
                  <li>発生日時</li>
                  <li>使用している端末・ブラウザ情報</li>
                  <li>エラーメッセージ（表示された場合）</li>
                </ul>
                <p>これらの情報をお知らせいただけると、問題解決がスムーズになります。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;