// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';

function TripForm({ onSave, onCancel, editTrip, existingTrips = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    status: 'planning'
  });
  const [validationErrors, setValidationErrors] = useState({});
  
  // 旅先方面の選択肢
  const destinations = [
    '北海道（道北）',
    '北海道（道東）',
    '北海道（道南）',
    '北海道（道央）',
    '東北方面',
    '北陸方面',
    '関東方面',
    '甲信越地方',
    '中部・東海方面',
    '近畿方面',
    '中国方面',
    '四国方面',
    '九州方面'
  ];

  const isEditMode = Boolean(editTrip && editTrip.id);

  // 編集モードの場合、既存データをセット
  useEffect(() => {
    if (editTrip) {
      if (editTrip.defaultStartDate) {
        // 新規作成時のデフォルト日付
        setFormData({
          title: '',
          destination: '',
          startDate: editTrip.defaultStartDate,
          endDate: editTrip.defaultEndDate,
          status: 'planning'
        });
      } else {
        // 既存データの編集
        setFormData({
          title: editTrip.title || '',
          destination: editTrip.destination || '',
          startDate: editTrip.start_date || '',
          endDate: editTrip.end_date || '',
          status: editTrip.status || 'planning'
        });
      }
    }
  }, [editTrip]);

  // 日程重複チェック
  const checkDateOverlap = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    return existingTrips.some(trip => {
      // 編集モードの場合、編集中の旅行は除外
      if (isEditMode && editTrip && editTrip.id && trip.id === editTrip.id) {
        return false;
      }
      
      if (!trip.start_date || !trip.end_date) return false;
      
      // 日付文字列を直接比較（YYYY-MM-DD形式）
      const newStart = startDate;
      const newEnd = endDate;
      const existingStart = trip.start_date;
      const existingEnd = trip.end_date;
      
      // 重複チェック: 新しい期間が既存の期間と重複するか
      const overlaps = (newStart <= existingEnd && newEnd >= existingStart);
      
      
      return overlaps;
    });
  };

  // 月間件数チェック
  const checkMonthlyLimit = (startDate) => {
    const targetDate = new Date(startDate);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    
    const monthlyTrips = existingTrips.filter(trip => {
      // 編集モードの場合、編集中の旅行は除外
      if (isEditMode && trip.id === editTrip.id) {
        return false;
      }
      
      const tripDate = trip.start_date ? new Date(trip.start_date) : new Date(trip.created_at);
      return tripDate.getFullYear() === targetYear && tripDate.getMonth() === targetMonth;
    });
    
    return monthlyTrips.length >= 2;
  };

  // バリデーション実行
  const validateForm = () => {
    const errors = {};
    
    if (!formData.startDate || !formData.endDate) {
      return errors;
    }
    
    // 日程重複チェック
    if (checkDateOverlap(formData.startDate, formData.endDate)) {
      const overlappingTrip = existingTrips.find(trip => {
        if (isEditMode && trip.id === editTrip.id) return false;
        if (!trip.start_date || !trip.end_date) return false;
        
        const newStart = new Date(formData.startDate);
        const newEnd = new Date(formData.endDate);
        const existingStart = new Date(trip.start_date);
        const existingEnd = new Date(trip.end_date);
        
        return (newStart <= existingEnd && newEnd >= existingStart);
      });
      
      errors.dateOverlap = `「${overlappingTrip?.title}」と日程が重複しています`;
    }
    
    // 月間件数チェック
    if (checkMonthlyLimit(formData.startDate)) {
      const targetDate = new Date(formData.startDate);
      const monthStr = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月`;
      errors.monthlyLimit = `${monthStr}は既に2件の旅行が登録されています（月間上限）`;
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: value
    };
    
    // 開始日を変更した場合、終了日がまだ設定されていない、または開始日より前の場合は自動設定
    if (name === 'startDate' && value) {
      const startDate = new Date(value);
      const currentEndDate = formData.endDate ? new Date(formData.endDate) : null;
      
      if (!currentEndDate || currentEndDate <= startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        newFormData.endDate = endDate.toISOString().split('T')[0];
      }
    }
    
    setFormData(newFormData);
    
    // 日付変更時のリアルタイムバリデーション
    if ((name === 'startDate' || name === 'endDate') && newFormData.startDate && newFormData.endDate) {
      const errors = validateFormData(newFormData);
      setValidationErrors(errors);
    }
  };

  // バリデーション実行（formDataを引数で受け取る版）
  const validateFormData = (data = formData) => {
    const errors = {};
    
    if (!data.startDate || !data.endDate) {
      return errors;
    }
    
    // 日程重複チェック
    if (checkDateOverlap(data.startDate, data.endDate)) {
      const overlappingTrip = existingTrips.find(trip => {
        if (isEditMode && trip.id === editTrip.id) return false;
        if (!trip.start_date || !trip.end_date) return false;
        
        // 日付文字列を直接比較（YYYY-MM-DD形式）
        const newStart = data.startDate;
        const newEnd = data.endDate;
        const existingStart = trip.start_date;
        const existingEnd = trip.end_date;
        
        const overlaps = (newStart <= existingEnd && newEnd >= existingStart);
        
        
        return overlaps;
      });
      
      errors.dateOverlap = `「${overlappingTrip?.title}」と日程が重複しています`;
    }
    
    // 月間件数チェック
    if (checkMonthlyLimit(data.startDate)) {
      const targetDate = new Date(data.startDate);
      const monthStr = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月`;
      errors.monthlyLimit = `${monthStr}は既に2件の旅行が登録されています（月間上限）`;
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 最終バリデーションチェック
    const errors = validateFormData();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return; // バリデーションエラーがある場合は送信しない
    }
    
    if (isEditMode) {
      // 編集モード：既存の旅行を更新
      const updatedTrip = {
        ...editTrip,
        title: formData.title,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status
      };
      
      onSave(updatedTrip, true); // 第2引数で編集モードを示す
    } else {
      // 新規作成モード：新しい旅行オブジェクトを作成
      const newTrip = {
        ...formData,
        destination: formData.destination,
        mainPurposes: [],
        subPurposes: [],
        items: [],
        review: null
      };
      
      onSave(newTrip, false);
    }
  };

  return (
    <div className="trip-form" data-edit-mode={isEditMode}>
      <h2>{isEditMode ? '旅行計画を編集' : '新しい旅行を計画'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">旅行タイトル</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="例: 2025年秋 紅葉狩りツアー"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="destination">旅先方面</label>
          <select
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
          >
            <option value="">選択してください</option>
            {destinations.map((dest) => (
              <option key={dest} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>
        
        <div className="date-section">
          <h3>📅 旅行日程</h3>
          <div className="date-inputs">
            <div className="form-group">
              <label htmlFor="startDate">開始日</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className={`date-input ${(validationErrors.dateOverlap || validationErrors.monthlyLimit) ? 'error' : ''}`}
              />
            </div>
            
            <div className="date-separator">〜</div>
            
            <div className="form-group">
              <label htmlFor="endDate">終了日</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                required
                className={`date-input ${(validationErrors.dateOverlap || validationErrors.monthlyLimit) ? 'error' : ''}`}
              />
            </div>
          </div>
          
          {formData.startDate && formData.endDate && (
            <div className="date-preview">
              <span className="preview-label">期間：</span>
              <span className="preview-text">
                {new Date(formData.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(formData.endDate).toLocaleDateString('ja-JP')}
                ({Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24) + 1)}日間)
              </span>
            </div>
          )}
          
          {/* バリデーションエラーメッセージ */}
          {(validationErrors.dateOverlap || validationErrors.monthlyLimit) && (
            <div className="validation-errors">
              {validationErrors.dateOverlap && (
                <div className="error-message overlap-error">
                  ⚠️ {validationErrors.dateOverlap}
                </div>
              )}
              {validationErrors.monthlyLimit && (
                <div className="error-message limit-error">
                  🚫 {validationErrors.monthlyLimit}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="status">ステータス</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="planning">📝 計画中</option>
            <option value="ongoing">🚗 進行中</option>
            <option value="completed">📒 完了</option>
          </select>
        </div>
        
        <div className="form-note">
          <p>💡 旅行作成後、詳細画面で目的や持ち物を設定できます</p>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            ← 戻る
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={Object.keys(validationErrors).length > 0}
          >
            {isEditMode ? '✏️ 更新する' : '🚐 旅行を作成'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TripForm;