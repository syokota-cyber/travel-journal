import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import PurposeManager from './PurposeManager';
import ItemsManager from './ItemsManager';
import TripReview from './TripReview';
import RulesConfirmation from './RulesConfirmation';
import ArticleSuggestions from './ArticleSuggestions';

function TripDetail({ trip, onBack, onUpdate, onDelete, onEdit }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('purposes');
  
  // 選択されたメイン目的に基づくアイコン取得
  const getPurposeIcon = () => {
    if (!selectedPurposes || !selectedPurposes.main || selectedPurposes.main.length === 0) {
      return '📘'; // デフォルト：ノート
    }
    
    // メイン目的の最初の項目からアイコンを決定
    const firstMainPurpose = selectedPurposes.main[0];
    if (!firstMainPurpose) {
      return '📘'; // メイン目的がない場合
    }
    
    const purposeName = firstMainPurpose.name || firstMainPurpose;
    
    // 目的名に基づいてアイコンを返す
    if (purposeName.includes('観光')) return '🏛️';
    if (purposeName.includes('温泉') || purposeName.includes('リラックス')) return '♨️';
    if (purposeName.includes('自然') || purposeName.includes('アウトドア')) return '🌿';
    if (purposeName.includes('グルメ') || purposeName.includes('食事')) return '🍽️';
    if (purposeName.includes('文化') || purposeName.includes('歴史')) return '🏛️';
    if (purposeName.includes('ショッピング')) return '🛍️';
    if (purposeName.includes('体験') || purposeName.includes('アクティビティ')) return '🎯';
    if (purposeName.includes('イベント') || purposeName.includes('祭り')) return '🎪';
    if (purposeName.includes('ドライブ') || purposeName.includes('移動')) return '🚗';
    if (purposeName.includes('SUP') || purposeName.includes('カヤック')) return '🏄';
    if (purposeName.includes('サイクリング')) return '🚴';
    if (purposeName.includes('スキー') || purposeName.includes('スノーボード')) return '⛷️';
    if (purposeName.includes('登山') || purposeName.includes('ハイキング')) return '🏔️';
    if (purposeName.includes('撮影') || purposeName.includes('写真')) return '📸';
    if (purposeName.includes('天体観測')) return '🌟';
    if (purposeName.includes('海水浴') || purposeName.includes('海')) return '🏖️';
    if (purposeName.includes('釣り')) return '🎣';
    if (purposeName.includes('花見')) return '🌸';
    if (purposeName.includes('紅葉')) return '🍁';
    
    return '📘'; // その他
  };

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
  
  // TripReviewの状態をTripDetailレベルで管理（永続化のため）
  const [reviewState, setReviewState] = useState({
    achievedPurposes: new Set(),
    usedItems: new Set()
  });
  
  // reviewStateのデバッグログ
  useEffect(() => {
    console.log('🔄 TripDetail - Review state changed:', {
      achievedPurposes: Array.from(reviewState.achievedPurposes),
      usedItems: Array.from(reviewState.usedItems)
    });
  }, [reviewState]);
  
  // TripReviewの状態をlocalStorageでも管理（確実な永続化）
  const saveReviewStateToStorage = (achievedPurposes, usedItems) => {
    const storageKey = `review_state_${trip.id}`;
    const stateData = {
      achievedPurposes: Array.from(achievedPurposes),
      usedItems: Array.from(usedItems),
      timestamp: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(stateData));
    console.log('💾 Saved review state to localStorage:', stateData);
  };
  
  const loadReviewStateFromStorage = () => {
    const storageKey = `review_state_${trip.id}`;
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const stateData = JSON.parse(storedData);
        const achievedPurposes = new Set(stateData.achievedPurposes || []);
        const usedItems = new Set(stateData.usedItems || []);
        console.log('📂 Loaded review state from localStorage:', stateData);
        return { achievedPurposes, usedItems };
      } catch (error) {
        console.error('Failed to parse stored review state:', error);
      }
    }
    return { achievedPurposes: new Set(), usedItems: new Set() };
  };
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
      
      // localStorageからレビュー状態を読み込み
      const storedState = loadReviewStateFromStorage();
      setReviewState(storedState);
      console.log('🔄 TripDetail - Loaded initial review state:', storedState);
    }

    // クリーンアップ関数: コンポーネントがアンマウントされる前にレビュー状態を保存
    return () => {
      console.log('🧹 TripDetail cleanup - Saving review state before unmount');
      // クリーンアップ時は現在のreviewStateを参照
      const currentReviewState = reviewState;
      if (currentReviewState.achievedPurposes.size > 0 || currentReviewState.usedItems.size > 0) {
        console.log('💾 Saving review state to database on cleanup:', {
          achievedPurposes: Array.from(currentReviewState.achievedPurposes),
          usedItems: Array.from(currentReviewState.usedItems)
        });
        // 非同期処理だが、クリーンアップなのでfire-and-forget
        saveReviewStateToDatabase().catch(console.error);
      }
    };
  }, [trip.id]); // reviewStateを依存配列から削除

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
    if (!startDate) return t('tripDetail.dateUnknown');
    const start = new Date(startDate).toLocaleDateString('ja-JP');
    const end = endDate ? new Date(endDate).toLocaleDateString('ja-JP') : '';
    return end ? `${start} - ${end}` : start;
  };

  const getStatusBadge = (status) => {
    const badges = {
      planning: `📝 ${t('common.status.planning')}`,
      ongoing: `🚗 ${t('common.status.ongoing')}`,
      completed: `📒 ${t('common.status.completed')}`
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
          alert(t('tripDetail.alerts.selectPurposeFirst'));
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
      alert(t('tripDetail.alerts.statusUpdateFailed'));
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
      alert(t('tripDetail.alerts.statusUpdateFailed'));
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
      planning: t('tripDetail.startTrip'),
      ongoing: t('tripDetail.completeTrip'),
      completed: t('tripDetail.reEdit')
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
      alert(t('tripDetail.alerts.dateUpdateFailed'));
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

  // TripReviewの状態更新ハンドラー
  const handleReviewStateUpdate = (newAchievedPurposes, newUsedItems) => {
    console.log('🔄 TripDetail - handleReviewStateUpdate called:', {
      newAchievedPurposes: Array.from(newAchievedPurposes),
      newUsedItems: Array.from(newUsedItems),
      currentReviewState: {
        achievedPurposes: Array.from(reviewState.achievedPurposes),
        usedItems: Array.from(reviewState.usedItems)
      }
    });
    
    setReviewState({
      achievedPurposes: newAchievedPurposes,
      usedItems: newUsedItems
    });
    
    // localStorageにも保存（確実な永続化）
    saveReviewStateToStorage(newAchievedPurposes, newUsedItems);
  };

  // レビュー状態をデータベースに保存する関数
  const saveReviewStateToDatabase = async () => {
    if (!trip.id) {
      console.log('⚠️ No trip ID, cannot save to database');
      return;
    }

    console.log('💾 saveReviewStateToDatabase called with reviewState:', {
      achievedPurposes: Array.from(reviewState.achievedPurposes),
      usedItems: Array.from(reviewState.usedItems),
      reviewStateSize: reviewState.achievedPurposes.size
    });

    if (reviewState.achievedPurposes.size === 0 && reviewState.usedItems.size === 0) {
      console.log('⚠️ No review data to save');
      return;
    }

    try {
      const achievedMainPurposes = [];
      const achievedSubPurposes = [];
      const usedItemsList = Array.from(reviewState.usedItems);

      console.log('🔍 Processing reviewState.achievedPurposes:', Array.from(reviewState.achievedPurposes));

      // 達成した目的を分類
      reviewState.achievedPurposes.forEach(key => {
        console.log('💾 Database save - Processing key:', key, typeof key);
        if (key.startsWith('main_')) {
          const idStr = key.replace('main_', '');
          console.log('  → Main purpose ID:', idStr);
          if (idStr && idStr !== 'null' && idStr !== 'undefined') {
            if (!isNaN(idStr) && !idStr.includes('-') && !idStr.includes('_')) {
              achievedMainPurposes.push(parseInt(idStr));
              console.log('    Added as integer:', parseInt(idStr));
            } else {
              achievedMainPurposes.push(idStr);
              console.log('    Added as string:', idStr);
            }
          }
        } else if (key.startsWith('sub_')) {
          const idStr = key.replace('sub_', '');
          console.log('  → Sub purpose ID:', idStr, 'isCustom:', idStr.includes('custom'));
          if (idStr && idStr !== 'null' && idStr !== 'undefined') {
            // カスタムスポットの場合は名前ベースIDに変換
            if (idStr.includes('custom') && !idStr.startsWith('custom_name_')) {
              // 旧形式のカスタムIDの場合、名前ベースに変換する必要がある
              // ここでは一旦そのまま保存し、復元時に処理
              console.log('    Legacy custom ID detected, saving as-is:', idStr);
            }
            achievedSubPurposes.push(idStr);
            console.log('    Added sub purpose:', idStr);
          }
        }
      });

      const reviewData = {
        trip_id: trip.id,
        achieved_main_purposes: achievedMainPurposes,
        achieved_sub_purposes: achievedSubPurposes,
        used_items: usedItemsList,
        review_date: new Date().toISOString()
      };

      console.log('💾 Final review data to save:', reviewData);
      console.log('📊 Achieved sub purposes count:', achievedSubPurposes.length);
      console.log('📊 Custom purposes in sub:', achievedSubPurposes.filter(id => String(id).startsWith('custom_name_')));

      // UPSERTを使用して確実に保存
      const { data, error } = await supabase
        .from('trip_reviews')
        .upsert(reviewData, {
          onConflict: 'trip_id'
        })
        .select();

      if (error) {
        console.error('❌ データベース保存エラー:', error);
        throw error;
      } else {
        console.log('✅ Review state saved to database successfully');
        console.log('✅ Saved data:', data);
      }
    } catch (error) {
      console.error('❌ レビュー状態のデータベース保存エラー:', error);
      throw error;
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
      alert(t('tripDetail.alerts.deleteFailed'));
    }
  };

  // タブ変更時の自動保存処理
  const handleTabChange = async (newTab) => {
    setActiveTab(newTab);
  };

  return (
    <div className="trip-detail">
      
      <div className="trip-detail-header">
        <div className="header-top">
          <h2>{trip.title}</h2>
          {trip.destination && (
            <div className="trip-destination-info">
              <span className="destination-label">📍 {t('tripForm.destination')}:</span>
              <span className="destination-value">{trip.destination}</span>
            </div>
          )}
          <div className="action-buttons">
            {trip.status === 'completed' && (
              <button
                className="btn-edit"
                onClick={() => onEdit && onEdit(trip)}
                title={t('common.edit')}
              >
                ✏️ {t('common.edit')}
              </button>
            )}
            <button
              className="btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              title={t('common.delete')}
            >
              🗑️ {t('common.delete')}
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
              {t('common.save')}
            </button>
            <button
              className="btn-cancel-date"
              onClick={() => setShowDateEdit(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div
            className="trip-date clickable"
            onClick={handleDateClick}
            title={t('tripDetail.clickToEditDate')}
          >
            📅 {formatDate(trip.start_date, trip.end_date)}
          </div>
        )}
        <div className="status-section">
          <div className="status-text">{t('tripForm.status')}: {getStatusBadge(trip.status)}</div>
          {getNextStatus() && (
            <button
              className="btn-status-change"
              onClick={() => handleStatusChange(getNextStatus())}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? t('tripDetail.updating') : getStatusButtonText()}
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
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={async () => {
            // カレンダータブクリック時もレビュー状態を保存
            console.log('📅 Calendar tab clicked - Saving review state before navigation');
            try {
              await saveReviewStateToDatabase();
              console.log('✅ Review state saved successfully from calendar tab');
            } catch (error) {
              console.error('❌ Failed to save review state from calendar tab:', error);
            }
            onBack();
          }}
          style={{
            flex: 1,
            padding: '15px',
            border: 'none',
            background: activeTab === 'calendar' ? 'white' : 'transparent',
            borderBottom: activeTab === 'calendar' ? '4px solid #FF9800' : 'none',
            fontWeight: activeTab === 'calendar' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontSize: '16px',
            color: activeTab === 'calendar' ? '#2c3e50' : '#7f8c8d',
            position: 'relative'
          }}
        >
          🗒️ {t('yearly.label')}
        </button>
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
          📍{t('tripDetail.tabs.purposes')}
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
          🎒 {t('tripDetail.tabs.items')}
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
          title={trip.status !== 'completed' ? t('tripDetail.tabs.reviewDisabled') : t('tripDetail.tabs.review')}
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
          ⭐ {t('tripDetail.tabs.review')}
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
        <>
          <PurposeManager
            tripId={trip.id}
            selectedPurposes={selectedPurposes}
            onPurposesUpdate={setSelectedPurposes}
          />
          <ArticleSuggestions trip={trip} />
        </>
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
          key={`review-${trip.id}`}
          tripId={trip.id}
          tripStatus={trip.status}
          selectedPurposes={selectedPurposes}
          initialAchievedPurposes={reviewState.achievedPurposes}
          initialUsedItems={reviewState.usedItems}
          onStateUpdate={handleReviewStateUpdate}
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
            <h3>{t('tripDetail.deleteModal.title')}</h3>
            <p>{t('tripDetail.deleteModal.message', { title: trip.title })}</p>
            <p className="warning-text">{t('tripDetail.deleteModal.warning')}</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDetail;