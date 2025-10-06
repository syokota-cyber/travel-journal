import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const ItemsManager = ({ selectedPurposes, tripId, onCustomItemsUpdate }) => {
  const { t } = useTranslation();
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      console.log('ItemsManager - selectedPurposes:', selectedPurposes);
      
      if (!selectedPurposes?.main?.length) {
        setRecommendedItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // デフォルトアイテムを取得
        const { data, error } = await supabase
          .from('default_items')
          .select('*')
          .in('main_purpose_id', selectedPurposes.main)
          .order('display_order');

        if (error) throw error;
        
        console.log('ItemsManager - fetched items:', data);
        
        // 重複を除去（同じ名前のアイテムは1つだけにする）
        const uniqueItems = [];
        const itemNames = new Set();
        
        (data || []).forEach(item => {
          if (!itemNames.has(item.name)) {
            itemNames.add(item.name);
            uniqueItems.push(item);
          }
        });
        
        console.log('ItemsManager - unique items:', uniqueItems);
        setRecommendedItems(uniqueItems);
        
        // localStorageから保存済みアイテムを取得
        if (tripId) {
          try {
            // カスタムアイテムの読み込み
            const savedCustomItems = localStorage.getItem(`trip_${tripId}_custom_items`);
            if (savedCustomItems) {
              const customItemsFormatted = JSON.parse(savedCustomItems);
              console.log('ItemsManager - loaded custom items:', customItemsFormatted);
              setCustomItems(customItemsFormatted);
              
              // 親コンポーネントに通知
              if (onCustomItemsUpdate) {
                onCustomItemsUpdate(customItemsFormatted);
              }
            }
            
            // チェック状態の読み込み
            const savedCheckedItems = localStorage.getItem(`trip_${tripId}_checked_items`);
            if (savedCheckedItems) {
              const checkedItemsArray = JSON.parse(savedCheckedItems);
              console.log('ItemsManager - loaded checked items:', checkedItemsArray);
              setCheckedItems(new Set(checkedItemsArray));
            }
          } catch (error) {
            console.error('localStorage読み込みエラー:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        setRecommendedItems([]);
      } finally {
        setLoading(false);
      }
    };

    // selectedPurposes.mainが存在する場合のみ実行
    if (selectedPurposes?.main) {
      fetchData();
    }
  }, [selectedPurposes?.main, tripId]);

  const handleItemToggle = (itemId, itemName, checked) => {
    const newCheckedItems = new Set(checkedItems);
    // itemIdが既に"custom_"を含んでいる場合はそのまま使用、そうでなければ"item_"を追加
    const key = itemId.toString().startsWith('custom_') ? itemId : `item_${itemId}`;
    
    if (checked) {
      newCheckedItems.add(key);
    } else {
      newCheckedItems.delete(key);
    }
    
    setCheckedItems(newCheckedItems);
    console.log(`${itemName}: ${checked ? 'チェック' : 'チェック解除'}, ID: ${itemId}, Key: ${key}`);
    
    // localStorageにチェック状態を即座に保存
    try {
      localStorage.setItem(`trip_${tripId}_checked_items`, JSON.stringify(Array.from(newCheckedItems)));
      console.log('チェック状態をlocalStorageに保存しました:', Array.from(newCheckedItems));
    } catch (error) {
      console.error('チェック状態保存エラー:', error);
    }
  };
  
  // カスタムアイテムの追加（文字数制限とサニタイズ）
  const handleAddCustomItem = () => {
    // 登録数制限チェック（3つまで）
    if (customItems.length >= 3) {
      alert('カスタム持ち物は3つまで登録できます');
      return;
    }
    
    // 入力値の検証
    const trimmedName = newItemName.trim();
    
    // 空白チェック
    if (!trimmedName) {
      alert('持ち物の名前を入力してください');
      return;
    }
    
    // 文字数チェック（全角20文字、半角40文字相当）
    const byteLength = new Blob([trimmedName]).size;
    if (byteLength > 60) { // 全角1文字=3バイト、20文字=60バイト
      alert('持ち物の名前は全角20文字以内で入力してください');
      return;
    }
    
    // 特殊文字のサニタイズ（基本的な文字のみ許可）
    const sanitizedName = trimmedName
      .replace(/[<>"'`;\\]/g, '') // HTMLやSQLで危険な文字を除去
      .substring(0, 50); // 念のため50文字で切る
    
    // 重複チェック
    if (customItems.some(item => item.name === sanitizedName)) {
      alert('同じ名前の持ち物が既に追加されています');
      return;
    }
    
    // カスタムアイテムを追加
    const newItem = {
      id: `custom_${Date.now()}`,
      name: sanitizedName,
      isCustom: true
    };
    
    const updatedItems = [...customItems, newItem];
    setCustomItems(updatedItems);
    setNewItemName('');
    
    // localStorageに即座に保存
    try {
      localStorage.setItem(`trip_${tripId}_custom_items`, JSON.stringify(updatedItems));
      console.log('カスタムアイテムをlocalStorageに保存しました');
    } catch (error) {
      console.error('カスタムアイテム保存エラー:', error);
    }
    
    // 親コンポーネントに通知
    if (onCustomItemsUpdate) {
      onCustomItemsUpdate(updatedItems);
    }
  };
  
  // カスタムアイテムの削除
  const handleRemoveCustomItem = (itemId) => {
    const updatedItems = customItems.filter(item => item.id !== itemId);
    setCustomItems(updatedItems);
    
    // チェック状態からも削除
    const newCheckedItems = new Set(checkedItems);
    newCheckedItems.delete(`custom_${itemId}`);
    newCheckedItems.delete(itemId);
    setCheckedItems(newCheckedItems);
    
    // localStorageに即座に保存
    try {
      localStorage.setItem(`trip_${tripId}_custom_items`, JSON.stringify(updatedItems));
      localStorage.setItem(`trip_${tripId}_checked_items`, JSON.stringify(Array.from(newCheckedItems)));
      console.log('カスタムアイテム削除をlocalStorageに保存しました');
    } catch (error) {
      console.error('カスタムアイテム削除保存エラー:', error);
    }
    
    // 親コンポーネントに通知
    if (onCustomItemsUpdate) {
      onCustomItemsUpdate(updatedItems);
    }
  };

  if (loading) {
    return <div>持ち物を読み込み中...</div>;
  }

  if (!selectedPurposes?.main?.length) {
    return (
      <div className="items-manager">
        <p>メイン目的を選択すると、おすすめの持ち物が表示されます。</p>
      </div>
    );
  }

  return (
    <div className="items-manager">
      <h3>🎒 {t('items.recommended')}</h3>
      
      {recommendedItems.length > 0 && (
        <div className="items-group">
          <div className="items-checklist">
            {recommendedItems.map(item => (
              <label key={item.id} className="item-checkbox">
                <input
                  type="checkbox"
                  checked={checkedItems.has(`item_${item.id}`)}
                  onChange={(e) => handleItemToggle(item.id, item.name, e.target.checked)}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* カスタム持ち物追加 */}
      <div className="custom-items">
        <h4>{t('items.custom')}</h4>
        <p className="custom-items-note">
          {t('items.customNote')}
        </p>
        <div className="add-custom-item">
          <input
            type="text"
            placeholder={t('items.addPlaceholder')}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomItem()}
            maxLength={50}
            disabled={customItems.length >= 3}
          />
          <button
            className="btn-secondary"
            onClick={handleAddCustomItem}
            disabled={customItems.length >= 3}
          >
            {t('items.addButton', { count: customItems.length })}
          </button>
        </div>
        
        {/* カスタムアイテムのリスト */}
        {customItems.length > 0 && (
          <div className="items-checklist">
            {customItems.map(item => (
              <label key={item.id} className="item-checkbox custom-item">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                />
                <span>{item.name}</span>
                <button 
                  className="btn-remove"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveCustomItem(item.id);
                  }}
                  title="削除"
                >
                  ×
                </button>
              </label>
            ))}
          </div>
        )}
      </div>

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
              console.log('持ち物保存開始:', { customItems, checkedItems, tripId });

              // localStorageに保存（既に個別に保存されているが、確認のために再保存）
              localStorage.setItem(`trip_${tripId}_custom_items`, JSON.stringify(customItems));
              localStorage.setItem(`trip_${tripId}_checked_items`, JSON.stringify(Array.from(checkedItems)));

              console.log('持ち物計画をlocalStorageに保存しました');
              alert('持ち物計画が保存されました');

            } catch (error) {
              console.error('保存エラーの詳細:', error);
              alert('保存に失敗しました: ' + (error.message || '不明なエラー'));
            }
          }}
          style={{ padding: '0.75rem 2rem' }}
        >
          {t('items.savePlan')}
        </button>
      </div>

    </div>
  );
};

export default ItemsManager;