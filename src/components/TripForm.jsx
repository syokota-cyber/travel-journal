// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { validateTripTitle, validateDestination, validateDate } from '../utils/validation';
import { handleFormError } from '../utils/errorHandler';
import { getDestinations } from '../constants/destinations';

function TripForm({ onSave, onCancel, editTrip, existingTrips = [] }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    status: 'planning'
  });
  const [validationErrors, setValidationErrors] = useState({});

  // 旅先方面の選択肢（i18n対応）
  const destinations = getDestinations(t);

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

      errors.dateOverlap = t('tripForm.errors.dateOverlap', { title: overlappingTrip?.title });
    }

    // 月間件数チェック
    if (checkMonthlyLimit(formData.startDate)) {
      const targetDate = new Date(formData.startDate);
      const monthStr = `${targetDate.getFullYear()}${t('common.year')}${targetDate.getMonth() + 1}${t('common.month')}`;
      errors.monthlyLimit = t('tripForm.errors.monthlyLimit', { month: monthStr });
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: value
    };
    
    // 開始日を変更した場合、終了日を自動設定（新規作成時のみ）
    if (name === 'startDate' && value) {
      const startDate = new Date(value);
      const currentEndDate = formData.endDate ? new Date(formData.endDate) : null;
      
      // 新規作成時、または終了日が未設定/開始日以前の場合は翌日に自動設定
      if (!isEditMode && (!currentEndDate || !formData.endDate)) {
        // 初回入力時は翌日に自動設定
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        newFormData.endDate = endDate.toISOString().split('T')[0];
      } else if (currentEndDate && currentEndDate < startDate) {
        // 終了日が開始日より前になる場合は調整
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

      errors.dateOverlap = t('tripForm.errors.dateOverlap', { title: overlappingTrip?.title });
    }

    // 月間件数チェック
    if (checkMonthlyLimit(data.startDate)) {
      const targetDate = new Date(data.startDate);
      const monthStr = `${targetDate.getFullYear()}${t('common.year')}${targetDate.getMonth() + 1}${t('common.month')}`;
      errors.monthlyLimit = t('tripForm.errors.monthlyLimit', { month: monthStr });
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 入力値検証とサニタイゼーション
    const titleValidation = validateTripTitle(formData.title);
    const destinationValidation = validateDestination(formData.destination);
    const startDateValidation = validateDate(formData.startDate);
    const endDateValidation = validateDate(formData.endDate);
    
    const validationErrors = {};
    if (!titleValidation.isValid) validationErrors.title = titleValidation.error;
    if (!destinationValidation.isValid) validationErrors.destination = destinationValidation.error;
    if (!startDateValidation.isValid) validationErrors.startDate = startDateValidation.error;
    if (!endDateValidation.isValid) validationErrors.endDate = endDateValidation.error;
    
    // 既存のバリデーションチェック
    const dateErrors = validateFormData();
    Object.assign(validationErrors, dateErrors);
    
    setValidationErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      const errorResult = handleFormError(validationErrors);
      if (errorResult) {
        console.error('フォーム検証エラー:', errorResult);
      }
      return; // バリデーションエラーがある場合は送信しない
    }
    
    if (isEditMode) {
      // 編集モード：既存の旅行を更新（サニタイズ済みの値を使用）
      const updatedTrip = {
        ...editTrip,
        title: titleValidation.value,
        destination: destinationValidation.value,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status
      };
      
      onSave(updatedTrip, true); // 第2引数で編集モードを示す
    } else {
      // 新規作成モード：新しい旅行オブジェクトを作成（サニタイズ済みの値を使用）
      const newTrip = {
        ...formData,
        title: titleValidation.value,
        destination: destinationValidation.value,
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
      <h2>{isEditMode ? t('tripForm.editTitle') : t('tripForm.newTitle')}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">{t('tripForm.tripTitle')}</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('tripForm.tripTitlePlaceholder')}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="destination">{t('tripForm.destination')}</label>
          <select
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
          >
            <option value="">{t('common.selectPlaceholder')}</option>
            {destinations.map((dest) => (
              <option key={dest.key} value={dest.name}>
                {dest.name}
              </option>
            ))}
          </select>
        </div>

        <div className="date-section">
          <h3>📅 {t('tripForm.schedule')}</h3>
          <div className="date-inputs">
            <div className="form-group">
              <label htmlFor="startDate">{t('tripForm.startDate')}</label>
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
              <label htmlFor="endDate">{t('tripForm.endDate')}</label>
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
              <span className="preview-label">{t('tripForm.period')}：</span>
              <span className="preview-text">
                {new Date(formData.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(formData.endDate).toLocaleDateString('ja-JP')}
                ({t('tripForm.days', { count: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24) + 1) })})
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
          <label htmlFor="status">{t('tripForm.status')}</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="planning">📝 {t('common.status.planning')}</option>
            <option value="ongoing">🚗 {t('common.status.ongoing')}</option>
            <option value="completed">📒 {t('common.status.completed')}</option>
          </select>
        </div>

        <div className="form-note">
          <p>💡 {t('tripForm.note')}</p>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            ← {t('common.back')}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={Object.keys(validationErrors).length > 0}
          >
            {isEditMode ? `✏️ ${t('common.update')}` : `🚐 ${t('tripForm.createTrip')}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TripForm;