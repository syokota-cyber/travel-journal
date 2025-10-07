import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { sanitizeInput } from '../utils/security';
import { localizeMainPurposes, localizeSubPurposes } from '../utils/i18nDataHelper';

const PurposeManager = ({ tripId, selectedPurposes, onPurposesUpdate }) => {
  const { t, i18n } = useTranslation();
  const [mainPurposes, setMainPurposes] = useState([]);
  const [subPurposes, setSubPurposes] = useState([]);
  const [selectedMainIds, setSelectedMainIds] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [customSubPurposes, setCustomSubPurposes] = useState([]);
  const [newSpotName, setNewSpotName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPurposes = async () => {
      try {
        const { data, error } = await supabase
          .from('trip_purposes')
          .select('purpose_type, main_purpose_id, sub_purpose_id')
          .eq('trip_id', tripId);

        if (error) throw error;

        const mainIds = [];
        const subIds = [];

        data?.forEach(item => {
          if (item.purpose_type === 'main' && item.main_purpose_id) {
            mainIds.push(item.main_purpose_id);
          } else if (item.purpose_type === 'sub' && item.sub_purpose_id) {
            subIds.push(item.sub_purpose_id);
          }
        });

        setSelectedMainIds(mainIds);
        setSelectedSubIds(subIds);

        // カスタム立ち寄りスポットを取得
        const { data: customData, error: customError } = await supabase
          .from('trip_purposes')
          .select('custom_purpose')
          .eq('trip_id', tripId)
          .eq('purpose_type', 'custom')
          .not('custom_purpose', 'is', null);

        if (!customError && customData) {
          const customSpots = customData.map((item, index) => ({
            id: `custom_name_${item.custom_purpose}`,
            name: item.custom_purpose,
            isCustom: true,
            type: 'sub'
          }));

          setCustomSubPurposes(customSpots);
          console.log('PurposeManager - loaded custom spots:', customSpots);
        }
      } catch (error) {
        console.error('Error loading saved purposes:', error);
      }
    };

    fetchPurposes();
    if (tripId) {
      loadSavedPurposes();
    }
  }, [tripId, i18n.language]); // 言語変更時も再取得

  useEffect(() => {
    // 既存の選択を復元（初回のみ）
    if (selectedPurposes && selectedPurposes.main) {
      setSelectedMainIds(selectedPurposes.main || []);
      setSelectedSubIds(selectedPurposes.sub || []);
    }
  }, [tripId]);

  const fetchPurposes = async () => {
    try {
      const [mainData, subData] = await Promise.all([
        supabase.from('main_purposes').select('*').order('display_order'),
        supabase.from('sub_purposes').select('*').order('display_order')
      ]);

      if (mainData.error) throw mainData.error;
      if (subData.error) throw subData.error;

      // i18n対応: 言語に応じたフィールド名を追加
      const localizedMainPurposes = localizeMainPurposes(mainData.data || [], i18n.language);
      const localizedSubPurposes = localizeSubPurposes(subData.data || [], i18n.language);

      setMainPurposes(localizedMainPurposes);
      setSubPurposes(localizedSubPurposes);
    } catch (error) {
      console.error('目的データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // カスタム目的の追加
  const addCustomSubPurpose = () => {
    if (!newSpotName.trim()) return;

    const newPurpose = {
      id: `custom_name_${newSpotName}`, // 名前ベースのIDを使用（エンコードなし）
      name: newSpotName,
      isCustom: true
    };

    setCustomSubPurposes([...customSubPurposes, newPurpose]);
    setNewSpotName('');
  };

  // 目的を保存
  const savePurposes = async (mainIds, subIds) => {
    if (!tripId) return;

    try {
      // 既存の目的を削除
      await supabase
        .from('trip_purposes')
        .delete()
        .eq('trip_id', tripId);

      // 新しい目的を挿入
      const inserts = [];
      
      mainIds.forEach(id => {
        inserts.push({
          trip_id: tripId,
          purpose_type: 'main',
          main_purpose_id: id,
          sub_purpose_id: null
        });
      });

      subIds.forEach(id => {
        inserts.push({
          trip_id: tripId,
          purpose_type: 'sub',
          main_purpose_id: null,
          sub_purpose_id: id
        });
      });

      // カスタム立ち寄りスポットも保存
      customSubPurposes.forEach(customSpot => {
        inserts.push({
          trip_id: tripId,
          purpose_type: 'custom',
          main_purpose_id: null,
          sub_purpose_id: null,
          custom_purpose: customSpot.name
        });
      });

      if (inserts.length > 0) {
        const { data: insertedData, error } = await supabase
          .from('trip_purposes')
          .insert(inserts)
          .select();

        if (error) throw error;
        
        // 保存成功のログ
        if (insertedData) {
          console.log('📍 PurposeManager - 保存成功:', insertedData);
          // 名前ベースのIDを使用しているため、特別な更新は不要
        }
      }
    } catch (error) {
      console.error('目的保存エラー:', error);
    }
  };

  const handleMainPurposeToggle = (purposeId) => {
    const newSelection = selectedMainIds.includes(purposeId)
      ? selectedMainIds.filter(id => id !== purposeId)
      : [...selectedMainIds, purposeId];
    
    setSelectedMainIds(newSelection);
    onPurposesUpdate({
      main: newSelection,
      sub: selectedSubIds
    });
    
    // データベースに保存
    savePurposes(newSelection, selectedSubIds);
  };

  const handleSubPurposeToggle = (purposeId) => {
    const newSelection = selectedSubIds.includes(purposeId)
      ? selectedSubIds.filter(id => id !== purposeId)
      : [...selectedSubIds, purposeId];
    
    setSelectedSubIds(newSelection);
    onPurposesUpdate({
      main: selectedMainIds,
      sub: newSelection,
      customSub: customSubPurposes
    });
    
    // データベースに保存
    savePurposes(selectedMainIds, newSelection);
  };

  const handleAddCustomSubPurpose = () => {
    if (customSubPurposes.length >= 3) {
      alert('立ち寄りスポットは最大3つまで追加できます');
      return;
    }
    
    const trimmedName = newSpotName.trim();
    if (!trimmedName) {
      alert('立ち寄りスポット名を入力してください');
      return;
    }
    
    if (trimmedName.length > 20) {
      alert('立ち寄りスポット名は20文字以内で入力してください');
      return;
    }
    
    // セキュリティ対策：入力値のサニタイズ
    const sanitizedName = sanitizeInput(trimmedName);
    
    // 重複チェック
    if (customSubPurposes.some(item => item.name === sanitizedName)) {
      alert('同じ名前の立ち寄りスポットが既に追加されています');
      return;
    }
    
    const customPurpose = {
      id: `custom_name_${sanitizedName}`,
      name: sanitizedName,
      isCustom: true,
      type: 'sub'
    };
    
    const newCustomPurposes = [...customSubPurposes, customPurpose];
    setCustomSubPurposes(newCustomPurposes);
    setNewSpotName('');
    
    onPurposesUpdate({
      main: selectedMainIds,
      sub: selectedSubIds,
      customSub: newCustomPurposes
    });
  };

  const handleRemoveCustomSubPurpose = (purposeId) => {
    const newCustomPurposes = customSubPurposes.filter(p => p.id !== purposeId);
    setCustomSubPurposes(newCustomPurposes);
    
    onPurposesUpdate({
      main: selectedMainIds,
      sub: selectedSubIds,
      customSub: newCustomPurposes
    });
  };

  if (loading) {
    return <div>目的データを読み込み中...</div>;
  }

  return (
    <div className="purpose-manager">
      {/* メイン目的 */}
      <div className="purpose-section">
        <h4>🎯 {t('purposes.mainPurposes')}</h4>
        <div className="purpose-grid">
          {mainPurposes.map(purpose => (
            <label key={purpose.id} className="purpose-item">
              <input
                type="checkbox"
                checked={selectedMainIds.includes(purpose.id)}
                onChange={() => handleMainPurposeToggle(purpose.id)}
              />
              <span>{purpose.displayName || purpose.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* サブ目的 */}
      <div className="purpose-section">
        <h4>📍 {t('purposes.subPurposes')}</h4>
        <div className="purpose-grid">
          {subPurposes.map(purpose => (
            <label key={purpose.id} className="purpose-item">
              <input
                type="checkbox"
                checked={selectedSubIds.includes(purpose.id)}
                onChange={() => handleSubPurposeToggle(purpose.id)}
              />
              <span>{purpose.displayName || purpose.name}</span>
            </label>
          ))}
        </div>
        
        {/* カスタム立ち寄りスポット追加 */}
        <div className="custom-items">
          <h4>{t('purposes.customStops')}</h4>
          <p className="custom-items-note">
            {t('purposes.customStopsNote')}
          </p>
          <div className="add-custom-item">
            <input
              type="text"
              placeholder={t('purposes.customStops') + '...'}
              value={newSpotName}
              onChange={(e) => setNewSpotName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSubPurpose()}
              maxLength={20}
              disabled={customSubPurposes.length >= 3}
            />
            <button
              className="btn-secondary"
              onClick={handleAddCustomSubPurpose}
              disabled={customSubPurposes.length >= 3}
            >
              {t('purposes.addButton')} ({customSubPurposes.length}/3)
            </button>
          </div>
          
          {/* カスタム立ち寄りスポットのリスト */}
          {customSubPurposes.length > 0 && (
            <div className="items-checklist">
              {customSubPurposes.map(purpose => (
                <label key={purpose.id} className="item-checkbox custom-item">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                  />
                  <span>{purpose.name}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveCustomSubPurpose(purpose.id)}
                    title="削除"
                  >
                    ×
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 選択されたメイン目的の表示 */}
      {selectedMainIds.length > 0 && (
        <div className="selected-purposes">
          <h5>{t('purposes.selectedMainPurposes')}</h5>
          <div className="selected-items">
            {selectedMainIds.map(id => {
              const purpose = mainPurposes.find(p => p.id === id);
              return purpose ? (
                <span key={id} className="selected-badge">
                  {purpose.displayName || purpose.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* 選択されたサブ目的の表示 */}
      {(selectedSubIds.length > 0 || customSubPurposes.length > 0) && (
        <div className="selected-purposes">
          <h5>{t('purposes.selectedSubPurposes')}</h5>
          <div className="selected-items">
            {/* 通常のサブ目的 */}
            {selectedSubIds.map(id => {
              const purpose = subPurposes.find(p => p.id === id);
              return purpose ? (
                <span key={id} className="selected-badge">
                  {purpose.displayName || purpose.name}
                </span>
              ) : null;
            })}
            {/* カスタム立ち寄りスポット */}
            {customSubPurposes.map(customPurpose => (
              <span key={customPurpose.id} className="selected-badge custom-badge">
                {customPurpose.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 計画保存ボタン */}
      <div className="save-section" style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              await savePurposes(selectedMainIds, selectedSubIds);
              alert('目的・立ち寄りスポットが保存されました');
            } catch (error) {
              console.error('保存エラー:', error);
              alert('保存に失敗しました');
            }
          }}
          style={{ padding: '0.75rem 2rem' }}
        >
          {t('purposes.savePlan')}
        </button>
      </div>
    </div>
  );
};

export default PurposeManager;