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
    sub: [],
    customItems: []
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
  }, [trip.id]);

  const fetchMainPurposeIds = async () => {
    try {
      // メイン目的とサブ目的の両方を取得
      const { data: purposeData, error } = await supabase
        .from('trip_purposes')
        .select('main_purpose_id, sub_purpose_id, purpose_type, custom_purpose')
        .eq('trip_id', trip.id);

      if (error) throw error;

      console.log('TripDetail - fetchMainPurposeIds data:', purposeData);

      const mainIds = [];
      const subIds = [];
      const customItems = [];
      
      purposeData?.forEach(item => {
        if (item.purpose_type === 'main' && item.main_purpose_id) {
          mainIds.push(item.main_purpose_id);
        } else if (item.purpose_type === 'sub' && item.sub_purpose_id) {
          subIds.push(item.sub_purpose_id);
        } else if (item.purpose_type === 'custom' && item.custom_purpose) {
          customItems.push({
            id: `custom_${Date.now()}_${customItems.length}`,
            name: item.custom_purpose,
            isCustom: true
          });
        }
      });
      
      console.log('TripDetail - mainIds:', mainIds);
      console.log('TripDetail - subIds:', subIds);
      console.log('TripDetail - customItems:', customItems);
      
      setMainPurposeIds(mainIds);
      
      // selectedPurposesも更新して、ItemsManagerに正しいデータを渡す
      setSelectedPurposes(prev => ({
        ...prev,
        main: mainIds,
        sub: subIds,
        customSub: customItems
      }));
    } catch (error) {
      console.error('目的ID取得エラー:', error);
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
      // 最新の目的データを再取得してから確認
      await fetchMainPurposeIds();
      
      console.log('handleStatusChange - mainPurposeIds:', mainPurposeIds);
      console.log('handleStatusChange - selectedPurposes:', selectedPurposes);
      
      // 少し待ってから状態を再確認（非同期更新のため）
      setTimeout(() => {
        const hasMainPurposes = mainPurposeIds.length > 0 || selectedPurposes.main?.length > 0;
        console.log('handleStatusChange - hasMainPurposes:', hasMainPurposes);
        
        if (!hasMainPurposes) {
          alert('まず目的を選択してから旅を開始してください。');
          setActiveTab('purposes');
          return;
        }
        setShowRulesConfirmation(true);
      }, 100);
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

  // タブ変更時の自動保存処理
  const handleTabChange = async (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <div className="trip-detail">
      <button 
        className="btn-back" 
        onClick={onBack}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '14px'
        }}
      >
        ← カレンダー一覧に戻る
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

      <div className="handbook-tabs" style={{
        display: 'flex',
        borderBottom: '3px solid #ddd',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <button 
          className={activeTab === 'purposes' ? 'active' : ''}
          onClick={() => handleTabChange('purposes')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            background: activeTab === 'purposes' ? 'white' : 'transparent',
            borderBottom: activeTab === 'purposes' ? '4px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'purposes' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '16px',
            color: activeTab === 'purposes' ? '#2c3e50' : '#7f8c8d',
            position: 'relative'
          }}
        >
          📍 目的
          {activeTab === 'purposes' && (
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              left: '0',
              right: '0',
              height: '4px',
              background: '#4CAF50',
              borderRadius: '2px'
            }} />
          )}
        </button>
        <button 
          className={activeTab === 'items' ? 'active' : ''}
          onClick={() => handleTabChange('items')}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            background: activeTab === 'items' ? 'white' : 'transparent',
            borderBottom: activeTab === 'items' ? '4px solid #2196F3' : 'none',
            fontWeight: activeTab === 'items' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '16px',
            color: activeTab === 'items' ? '#2c3e50' : '#7f8c8d',
            position: 'relative'
          }}
        >
          🎒 持ち物
          {activeTab === 'items' && (
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              left: '0',
              right: '0',
              height: '4px',
              background: '#2196F3',
              borderRadius: '2px'
            }} />
          )}
        </button>
        <button 
          className={`${activeTab === 'review' ? 'active' : ''} ${trip.status !== 'completed' ? 'disabled' : ''}`}
          onClick={() => trip.status === 'completed' ? handleTabChange('review') : null}
          disabled={trip.status !== 'completed'}
          title={trip.status !== 'completed' ? 'レビューは旅行完了後に利用できます' : 'レビュー'}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            background: activeTab === 'review' ? 'white' : trip.status !== 'completed' ? '#e0e0e0' : 'transparent',
            borderBottom: activeTab === 'review' ? '4px solid #FF9800' : 'none',
            fontWeight: activeTab === 'review' ? 'bold' : 'normal',
            cursor: trip.status === 'completed' ? 'pointer' : 'not-allowed',
            opacity: trip.status !== 'completed' ? 0.5 : 1,
            transition: 'all 0.3s',
            fontSize: '16px',
            color: activeTab === 'review' ? '#2c3e50' : '#7f8c8d',
            position: 'relative'
          }}
        >
          📝 レビュー
          {activeTab === 'review' && (
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              left: '0',
              right: '0',
              height: '4px',
              background: '#FF9800',
              borderRadius: '2px'
            }} />
          )}
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
          onCustomItemsUpdate={(customItems) => {
            setSelectedPurposes(prev => ({
              ...prev,
              customItems
            }));
          }}
        />
      )}

      {activeTab === 'review' && (
        <TripReview
          key={`review-${trip.id}-${Date.now()}`}
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