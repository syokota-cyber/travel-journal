import React, { useState } from 'react';
import { categories } from '../data/mockData';
import { sanitizeInput } from '../utils/security';

function PurposeForm({ type, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    priority: type === 'main' ? 'medium' : null,
    memo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // セキュリティ対策：入力値のサニタイズ
    const sanitizedName = sanitizeInput(formData.name);
    
    if (type === 'sub' && sanitizedName.length > 20) {
      alert('立ち寄りスポット名は20文字以内で入力してください');
      return;
    }
    
    const newPurpose = {
      id: `${type}-${Date.now()}`,
      ...formData,
      name: sanitizedName,
      achieved: false,
      satisfaction: null,
      type
    };
    
    onSave(newPurpose);
  };

  const categoryOptions = type === 'main' ? categories.mainPurposes : categories.subPurposes;

  return (
    <div className="purpose-form">
      <h3>{type === 'main' ? '🎯 メイン目的を追加' : '📍 立ち寄りスポットを追加'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group-inline">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={type === 'sub' ? "立ち寄りスポット名（20文字以内）" : "目的を入力"}
            required
            autoFocus
            maxLength={type === 'sub' ? 20 : undefined}
          />
          
          {type !== 'sub' && (
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">カテゴリ選択</option>
              {Object.entries(categoryOptions).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          )}
          
          {type === 'main' && (
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          )}
        </div>
        
        <div className="form-actions-inline">
          <button type="button" onClick={onCancel} className="btn-text">
            キャンセル
          </button>
          <button type="submit" className="btn-text-primary">
            追加
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurposeForm;