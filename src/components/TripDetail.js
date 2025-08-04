import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PurposeManager from './PurposeManager';
import ItemsManager from './ItemsManager';
import TripReview from './TripReview';
import RulesConfirmation from './RulesConfirmation';

function TripDetail({ trip, onBack, onUpdate, onDelete, onEdit }) {
  const [activeTab, setActiveTab] = useState('purposes');

  // ステータスが完了でない場合、レビュータブから他のタブに切り替える
  useEffect(() => {
    if (activeTab === 'review' && trip.status !== 'completed') {
      setActiveTab('purposes');
    }
  }, [trip.status, activeTab]);
  const [selectedPurposes, setSelectedPurposes] = useState({
    main: [],
    sub: []
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRulesConfirmation, setShowRulesConfirmation] = useState(false);
  const [mainPurposeIds, setMainPurposeIds] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [dateFormData, setDateFormData] = useState({
    startDate: '',
    endDate: ''
  });

  // メイン目的IDを取得
  useEffect(() => {
    if (trip.id) {
      fetchMainPurposeIds();
    }
  }, [trip.id, selectedPurposes]);

  const fetchMainPurposeIds = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_purposes')
        .select('main_purpose_id')
        .eq('trip_id', trip.id)
        .eq('purpose_type', 'main');

      if (error) throw error;

      const ids = data?.map(item => item.main_purpose_id).filter(id => id) || [];
      setMainPurposeIds(ids);
    } catch (error) {
      console.error('メイン目的ID取得エラー:', error);
    }
  };

  const formatDate = (startDate, endDate) => {
    if (!startDate) return '日程未定';
    const start = new Date(startDate).toLocaleDateString('ja-JP');
    const end = endDate ? new Date(endDate).toLocaleDateString('ja-JP') : '';
    return end ? `${start} - ${end}` : start;
  };

  const getStatusBadge = (status) => {
    const badges = {
      planning: '📝 計画中',
      ongoing: '🚗 進行中', 
      completed: '✅ 完了'
    };
    return badges[status] || status;
  };

  // ステータスを更新
  const handleStatusChange = async (newStatus) => {
    // 計画中から進行中に変更する場合は、ルール確認を表示
    if (trip.status === 'planning' && newStatus === 'ongoing') {
      if (mainPurposeIds.length === 0) {
        alert('まず目的を選択してから旅を開始してください。');
        setActiveTab('purposes');
        return;
      }
      setShowRulesConfirmation(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', trip.id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        onUpdate(data[0]);
        // レビュータブに自動切り替え（完了時）
        if (newStatus === 'completed') {
          setActiveTab('review');
        }
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ルール確認完了時のコールバック
  const handleRulesConfirmed = async () => {
    setShowRulesConfirmation(false);
    
    setIsUpdatingStatus(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ status: 'ongoing' })
        .eq('id', trip.id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        onUpdate(data[0]);
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 次のステータスを取得
  const getNextStatus = () => {
    const statusFlow = {
      planning: 'ongoing',
      ongoing: 'completed',
      completed: 'planning' // 完了後も計画に戻せる
    };
    return statusFlow[trip.status];
  };

  // ステータス変更ボタンのテキストを取得
  const getStatusButtonText = () => {
    const buttonTexts = {
      planning: '旅を開始',
      ongoing: '旅を完了',
      completed: '再編集する'
    };
    return buttonTexts[trip.status];
  };

  // 日付編集機能
  const handleDateClick = () => {
    setDateFormData({
      startDate: trip.start_date || '',
      endDate: trip.end_date || ''
    });
    setShowDateEdit(true);
  };

  const handleDateSave = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          start_date: dateFormData.startDate,
          end_date: dateFormData.endDate
        })
        .eq('id', trip.id)
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        onUpdate(data[0]);
        setShowDateEdit(false);
      }
    } catch (error) {
      console.error('日付更新エラー:', error);
      alert('日付の更新に失敗しました');
    }
  };

  const handleDateChange = (field, value) => {
    setDateFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 開始日を変更した場合、終了日を翌日に自動設定
    if (field === 'startDate' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      setDateFormData(prev => ({
        ...prev,
        startDate: value,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  };

  // 削除機能
  const handleDelete = async () => {
    try {
      // 関連データを削除
      await supabase.from('trip_purposes').delete().eq('trip_id', trip.id);
      await supabase.from('trip_items').delete().eq('trip_id', trip.id);
      await supabase.from('trip_reviews').delete().eq('trip_id', trip.id);
      
      // 旅行を削除
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', trip.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      onDelete && onDelete();
      onBack();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="trip-detail">
      <button className="btn-back" onClick={onBack}>
        ← 戻る
      </button>
      
      <div className="trip-detail-header">
        <div className="header-top">
          <h2>{trip.title}</h2>
          <div className="action-buttons">
            {trip.status === 'completed' && (
              <button 
                className="btn-edit"
                onClick={() => onEdit && onEdit(trip)}
                title="編集"
              >
                ✏️ 編集
              </button>
            )}
            <button 
              className="btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              title="削除"
            >
              🗑️ 削除
            </button>
          </div>
        </div>
        {showDateEdit ? (
          <div className="date-edit-form">
            <input
              type="date"
              value={dateFormData.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="date-input-inline"
            />
            <span className="date-separator">〜</span>
            <input
              type="date"
              value={dateFormData.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              min={dateFormData.startDate}
              className="date-input-inline"
            />
            <button 
              className="btn-save-date"
              onClick={handleDateSave}
            >
              保存
            </button>
            <button 
              className="btn-cancel-date"
              onClick={() => setShowDateEdit(false)}
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div 
            className="trip-date clickable"
            onClick={handleDateClick}
            title="クリックして日付を編集"
          >
            📅 {formatDate(trip.start_date, trip.end_date)}
          </div>
        )}
        <div className="status-section">
          <div className="status-text">ステータス: {getStatusBadge(trip.status)}</div>
          {getNextStatus() && (
            <button 
              className="btn-status-change"
              onClick={() => handleStatusChange(getNextStatus())}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? '更新中...' : getStatusButtonText()}
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'purposes' ? 'active' : ''}
          onClick={() => setActiveTab('purposes')}
        >
          目的
        </button>
        <button 
          className={activeTab === 'items' ? 'active' : ''}
          onClick={() => setActiveTab('items')}
        >
          持ち物
        </button>
        <button 
          className={`${activeTab === 'review' ? 'active' : ''} ${trip.status !== 'completed' ? 'disabled' : ''}`}
          onClick={() => trip.status === 'completed' ? setActiveTab('review') : null}
          disabled={trip.status !== 'completed'}
          title={trip.status !== 'completed' ? 'レビューは旅行完了後に利用できます' : 'レビュー'}
        >
          レビュー
        </button>
      </div>

      {activeTab === 'purposes' && (
        <PurposeManager
          tripId={trip.id}
          selectedPurposes={selectedPurposes}
          onPurposesUpdate={setSelectedPurposes}
        />
      )}

      {activeTab === 'items' && (
        <ItemsManager
          selectedPurposes={selectedPurposes}
          tripId={trip.id}
        />
      )}

      {activeTab === 'review' && (
        <TripReview
          tripId={trip.id}
          tripStatus={trip.status}
          selectedPurposes={selectedPurposes}
        />
      )}

      {/* ルール・マナー確認モーダル */}
      {showRulesConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="modal-close" 
              onClick={() => setShowRulesConfirmation(false)}
            >
              ×
            </button>
            <RulesConfirmation
              tripId={trip.id}
              mainPurposeIds={mainPurposeIds}
              onConfirmComplete={handleRulesConfirmed}
            />
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <h3>旅行計画を削除</h3>
            <p>「{trip.title}」を削除しますか？</p>
            <p className="warning-text">この操作は元に戻せません。</p>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                キャンセル
              </button>
              <button 
                className="btn-danger"
                onClick={handleDelete}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDetail;