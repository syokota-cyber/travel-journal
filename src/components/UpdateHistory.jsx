import React from 'react';
import { CURRENT_VERSION, VERSION_HISTORY } from '../config/version';

const UpdateHistory = ({ onClose }) => {
  // version.js から一元管理されたバージョン履歴を取得
  const updates = VERSION_HISTORY;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content update-history" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 更新履歴</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="update-history-content">
          {updates.map((update, index) => (
            <div key={index} className="update-entry">
              <div className="update-header">
                <span className="version-badge">v{update.version}</span>
                <span className="update-date">{update.date}</span>
              </div>
              <ul className="feature-list">
                {update.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="modal-footer">
          <p className="app-info">
            キャンピングカー旅行手帳 v{CURRENT_VERSION}<br />
            © 2025 Campingcar Travel Tips.com
          </p>
        </div>
        
        <style jsx>{`
          .update-history {
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
          }
          
          .update-history-content {
            padding: 20px;
          }
          
          .update-entry {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .update-entry:last-child {
            border-bottom: none;
          }
          
          .update-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .version-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          
          .update-date {
            color: #666;
            font-size: 14px;
          }
          
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .feature-list li {
            padding: 8px 0;
            padding-left: 10px;
            border-left: 3px solid #f0f0f0;
            margin-bottom: 5px;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .feature-list li:hover {
            border-left-color: #667eea;
            background: #f8f9fa;
          }
          
          .modal-footer {
            padding: 15px 20px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            text-align: center;
          }
          
          .app-info {
            margin: 0;
            color: #666;
            font-size: 12px;
            line-height: 1.5;
          }
          
          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
          }
          
          .close-button:hover {
            background: #f0f0f0;
            color: #333;
          }
        `}</style>
      </div>
    </div>
  );
};

export default UpdateHistory;