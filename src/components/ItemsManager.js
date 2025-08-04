import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ItemsManager = ({ selectedPurposes, tripId }) => {
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => {
    const fetchRecommendedItems = async () => {
      if (!selectedPurposes?.main?.length) {
        setRecommendedItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('purpose_checklist_items')
          .select('*')
          .in('purpose_id', selectedPurposes.main)
          .order('display_order');

        if (error) throw error;
        setRecommendedItems(data || []);
      } catch (error) {
        console.error('Error fetching recommended items:', error);
        setRecommendedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedItems();
  }, [selectedPurposes]);

  const handleItemToggle = (itemId, itemName, checked) => {
    const newCheckedItems = new Set(checkedItems);
    const key = `item_${itemId}`;
    
    if (checked) {
      newCheckedItems.add(key);
    } else {
      newCheckedItems.delete(key);
    }
    
    setCheckedItems(newCheckedItems);
    console.log(`${itemName}: ${checked ? 'チェック' : 'チェック解除'}`);
    // TODO: Supabaseのtrip_checklistsテーブルに保存
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
    
    setCustomItems([...customItems, newItem]);
    setNewItemName('');
  };
  
  // カスタムアイテムの削除
  const handleRemoveCustomItem = (itemId) => {
    setCustomItems(customItems.filter(item => item.id !== itemId));
    
    // チェック状態からも削除
    const newCheckedItems = new Set(checkedItems);
    newCheckedItems.delete(`custom_${itemId}`);
    setCheckedItems(newCheckedItems);
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
      <h3>🎒 おすすめの持ち物</h3>
      
      {Object.entries(recommendedItems).map(([purposeId, purposeData]) => (
        <div key={purposeId} className="items-group">
          <h4>{purposeData.name}の持ち物</h4>
          <div className="items-checklist">
            {purposeData.items.map(item => (
              <label key={`${purposeId}_${item.id}`} className="item-checkbox">
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
      ))}

      {/* カスタム持ち物追加 */}
      <div className="custom-items">
        <h4>カスタム持ち物</h4>
        <p className="custom-items-note">
          ※ 最大3つまで登録可能（全角20文字以内）
        </p>
        <div className="add-custom-item">
          <input
            type="text"
            placeholder="持ち物を追加..."
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
            追加 ({customItems.length}/3)
          </button>
        </div>
        
        {/* カスタムアイテムのリスト */}
        {customItems.length > 0 && (
          <div className="items-checklist">
            {customItems.map(item => (
              <label key={item.id} className="item-checkbox custom-item">
                <input
                  type="checkbox"
                  checked={checkedItems.has(`custom_${item.id}`)}
                  onChange={(e) => handleItemToggle(item.id, item.name, e.target.checked)}
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
    </div>
  );
};

export default ItemsManager;