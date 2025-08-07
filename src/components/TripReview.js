import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.jsの登録
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TripReview = ({ tripId, tripStatus, selectedPurposes = {} }) => {
  const [loading, setLoading] = useState(true);
  const [plannedPurposes, setPlannedPurposes] = useState({ main: [], sub: [] });
  const [plannedItems, setPlannedItems] = useState([]);
  const [achievedPurposes, setAchievedPurposes] = useState(new Set());
  const [usedItems, setUsedItems] = useState(new Set());
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    console.log('TripReview useEffect triggered with tripId:', tripId);
    if (tripId) {
      fetchPlannedData();
      fetchReviewData();
    }
  }, [tripId]);
  
  // レビュー画面が表示される度にデータを再読み込み
  useEffect(() => {
    console.log('TripReview component mounted/updated');
    if (tripId) {
      console.log('Forcing review data fetch on component update');
      fetchReviewData();
    }
  }, []);

  // achievedPurposesの変更を監視
  useEffect(() => {
    console.log('achievedPurposes state changed:', Array.from(achievedPurposes));
  }, [achievedPurposes]);

  // usedItemsの変更を監視
  useEffect(() => {
    console.log('usedItems state changed:', Array.from(usedItems));
  }, [usedItems]);

  // 計画データの取得
  const fetchPlannedData = async () => {
    try {
      console.log('🔍 TripReview fetchPlannedData started for tripId:', tripId);
      // 計画された目的を取得（JOINを使わず個別に取得）
      const { data: purposeData, error: purposeError } = await supabase
        .from('trip_purposes')
        .select('purpose_type, main_purpose_id, sub_purpose_id')
        .eq('trip_id', tripId);
        
      console.log('Raw purpose data:', purposeData);

      if (purposeError) throw purposeError;

      const mainPurposes = [];
      const subPurposes = [];

      // メイン目的を個別に取得
      const mainIds = purposeData?.filter(p => p.purpose_type === 'main' && p.main_purpose_id)
        .map(p => p.main_purpose_id) || [];
      
      console.log('🔍 Main IDs from trip_purposes:', mainIds);
      
      if (mainIds.length > 0) {
        const { data: mainData } = await supabase
          .from('main_purposes')
          .select('id, name')
          .in('id', mainIds);
        
        console.log('🔍 Main data from main_purposes table:', mainData);
        
        mainData?.forEach(item => {
          console.log('🔍 Adding main purpose:', item.id, item.name, typeof item.id);
          mainPurposes.push({
            id: item.id,
            name: item.name
          });
        });
      }

      // サブ目的を個別に取得
      const subIds = purposeData?.filter(p => p.purpose_type === 'sub' && p.sub_purpose_id)
        .map(p => p.sub_purpose_id) || [];
      
      console.log('🔍 Sub IDs from trip_purposes:', subIds);
      
      if (subIds.length > 0) {
        const { data: subData } = await supabase
          .from('sub_purposes')
          .select('id, name')
          .in('id', subIds);
        
        console.log('🔍 Sub data from sub_purposes table:', subData);
        
        subData?.forEach(item => {
          console.log('🔍 Adding sub purpose:', item.id, item.name, typeof item.id);
          subPurposes.push({
            id: item.id,
            name: item.name
          });
        });
      }
      
      console.log('Processed main purposes:', mainPurposes);
      console.log('Processed sub purposes:', subPurposes);

      // カスタムサブ目的を追加（2つのソースから取得）
      const allSubPurposes = [...subPurposes];
      
      // selectedPurposesのcustomSubから取得
      if (selectedPurposes.customSub) {
        selectedPurposes.customSub.forEach(customSub => {
          allSubPurposes.push({
            id: customSub.id,
            name: customSub.name,
            isCustom: true
          });
        });
      }
      
      // データベースからカスタム目的を直接取得
      const { data: customPurposeData, error: customPurposeError } = await supabase
        .from('trip_purposes')
        .select('custom_purpose')
        .eq('trip_id', tripId)
        .eq('purpose_type', 'custom')
        .not('custom_purpose', 'is', null);
        
      if (!customPurposeError && customPurposeData) {
        customPurposeData.forEach((item, index) => {
          // 既に追加されていない場合のみ追加
          if (!allSubPurposes.some(p => p.name === item.custom_purpose)) {
            allSubPurposes.push({
              id: `custom_db_${Date.now()}_${index}`,
              name: item.custom_purpose,
              isCustom: true
            });
          }
        });
      }

      setPlannedPurposes({ main: mainPurposes, sub: allSubPurposes });

      // メイン目的に基づいて推奨持ち物を取得
      if (mainPurposes.length > 0) {
        const mainPurposeIds = mainPurposes.map(p => p.id);
        console.log('🔍 TripReview - Main purpose IDs for items:', mainPurposeIds);
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('default_items')
          .select('*')
          .in('main_purpose_id', mainPurposeIds)
          .order('display_order');

        console.log('🔍 TripReview - Raw items data from DB:', itemsData);

        if (itemsError) throw itemsError;

        // 重複を排除（名前ベースで重複チェック）
        const uniqueItems = new Map();
        const itemNameSet = new Set();
        
        itemsData?.forEach(item => {
          if (!itemNameSet.has(item.name)) {
            itemNameSet.add(item.name);
            uniqueItems.set(item.name, {
              id: item.id,
              name: item.name,
              type: 'default',
              main_purpose_id: item.main_purpose_id
            });
          }
        });

        // localStorageからチェック済み持ち物のみを取得して表示用に構築
        console.log('🔍 TripReview - Building checked items only for display');
        console.log('🔍 TripReview - Current tripId:', tripId);
        
        // localStorageの全体を確認
        console.log('🔍 All localStorage keys:', Object.keys(localStorage));
        console.log('🔍 localStorage keys matching trip pattern:', 
          Object.keys(localStorage).filter(key => key.includes('trip_')));
        
        const checkedItemsFromStorage = localStorage.getItem(`trip_${tripId}_checked_items`);
        const customItemsFromStorage = localStorage.getItem(`trip_${tripId}_custom_items`);
        
        console.log('🔍 Checked items from storage:', checkedItemsFromStorage);
        console.log('🔍 Custom items from storage:', customItemsFromStorage);
        console.log('🔍 Available unique items:', Array.from(uniqueItems.values()));
        
        const checkedOnlyItems = [];
        
        // チェック済みデフォルトアイテムを処理
        if (checkedItemsFromStorage) {
          try {
            const checkedItemsArray = JSON.parse(checkedItemsFromStorage);
            console.log('🔍 Parsed checked items array:', checkedItemsArray);
            
            // チェック済みのデフォルトアイテムのみを追加
            checkedItemsArray.forEach(key => {
              console.log('🔍 Processing key:', key);
              if (key.startsWith('item_')) {
                // UUID形式のIDを抽出（parseIntではなく文字列として扱う）
                const itemId = key.replace('item_', '');
                console.log(`🔍 Extracted item ID: "${itemId}"`);
                
                // IDで照合（文字列比較）
                const item = Array.from(uniqueItems.values()).find(i => {
                  console.log(`   Comparing: "${i.id}" === "${itemId}" ? ${i.id === itemId}`);
                  return i.id === itemId || i.id === parseInt(itemId) || String(i.id) === itemId;
                });
                
                console.log(`🔍 Looking for item ID "${itemId}" in uniqueItems:`, item);
                if (item) {
                  checkedOnlyItems.push({
                    ...item,
                    isChecked: true
                  });
                  console.log('✅ Added checked default item:', item.name);
                } else {
                  console.log(`❌ Item ID "${itemId}" not found in uniqueItems`);
                  console.log('   Available IDs:', Array.from(uniqueItems.values()).map(i => i.id));
                }
              }
            });
          } catch (error) {
            console.error('Error parsing checked items:', error);
          }
        } else {
          console.log('🔍 No checked items found in localStorage');
        }
        
        // カスタムアイテムを処理（独立して）
        if (customItemsFromStorage) {
          try {
            const customItems = JSON.parse(customItemsFromStorage);
            console.log('🔍 Processing custom items:', customItems);
            customItems.forEach(customItem => {
              checkedOnlyItems.push({
                id: customItem.id,
                name: customItem.name,
                type: 'custom',
                isCustom: true,
                isChecked: true
              });
              console.log('✅ Added custom item:', customItem.name);
            });
          } catch (error) {
            console.error('Error parsing custom items:', error);
          }
        } else {
          console.log('🔍 No custom items found in localStorage');
        }
        
        console.log('🎯 TripReview - Final checked-only items:', checkedOnlyItems);
        console.log('🎯 Total items to display:', checkedOnlyItems.length);
        setPlannedItems(checkedOnlyItems);
      } else {
        setPlannedItems([]);
      }

    } catch (error) {
      console.error('計画データ取得エラー:', error);
    }
  };

  // レビューデータの取得
  const fetchReviewData = async () => {
    try {
      console.log('=== FETCHING REVIEW DATA ===');
      console.log('Trip ID:', tripId);
      
      // trip_reviewsテーブルからレビューデータを取得
      const { data, error } = await supabase
        .from('trip_reviews')
        .select('*')
        .eq('trip_id', tripId);
      
      console.log('Review fetch result:', { data, error });

      if (error) {
        throw error;
      }
      
      // データがある場合は最初のレコードを使用
      const reviewData = data && data.length > 0 ? data[0] : null;
      console.log('Found review data:', reviewData);

      if (reviewData) {
        // 保存されたレビューデータを復元
        const achievedSet = new Set();
        const usedSet = new Set();

        console.log('🔄 Restoring achieved_main_purposes:', reviewData.achieved_main_purposes);
        if (reviewData.achieved_main_purposes) {
          reviewData.achieved_main_purposes.forEach(id => {
            const key = `main_${id}`;
            console.log('➕ Adding main achievement key:', key, 'Original ID:', id, 'Type:', typeof id);
            achievedSet.add(key);
          });
        }
        
        console.log('Restoring achieved_sub_purposes:', reviewData.achieved_sub_purposes);
        if (reviewData.achieved_sub_purposes) {
          reviewData.achieved_sub_purposes.forEach(id => {
            const key = `sub_${id}`;
            console.log('Adding sub achievement key:', key);
            achievedSet.add(key);
          });
        }
        
        console.log('Restoring used_items:', reviewData.used_items);
        if (reviewData.used_items) {
          reviewData.used_items.forEach(id => {
            console.log('Adding used item:', id);
            usedSet.add(id);
          });
        }

        console.log('Final achievedSet:', Array.from(achievedSet));
        console.log('Final usedSet:', Array.from(usedSet));

        console.log('Setting state with achievedSet...');
        setAchievedPurposes(achievedSet);
        console.log('Setting state with usedSet...');
        setUsedItems(usedSet);
        
        // 状態設定後の確認
        setTimeout(() => {
          console.log('After setState - achievedPurposes:', Array.from(achievedPurposes));
          console.log('After setState - usedItems:', Array.from(usedItems));
        }, 100);
      } else {
        console.log('No review data found for this trip');
      }
    } catch (error) {
      console.error('レビューデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // レビューデータを保存
  const saveReviewData = async () => {
    if (!tripId) return;

    try {
      console.log('=== SAVING REVIEW DATA ===');
      console.log('Trip ID:', tripId);
      console.log('Achieved Purposes (raw):', Array.from(achievedPurposes));
      console.log('Used Items (raw):', Array.from(usedItems));
      
      const achievedMainPurposes = [];
      const achievedSubPurposes = [];
      const usedItemsList = Array.from(usedItems);

      // 達成した目的を分類
      achievedPurposes.forEach(key => {
        console.log('Processing key:', key);
        if (key.startsWith('main_')) {
          const idStr = key.replace('main_', '');
          console.log('🔍 Processing main purpose ID:', idStr, 'Type:', typeof idStr);
          
          // 無効なIDをスキップ
          if (!idStr || idStr === 'null' || idStr === 'undefined') {
            console.log('❌ Skipping invalid main ID:', idStr);
            return;
          }
          
          // 数値IDまたはUUIDの両方に対応
          if (!isNaN(idStr) && !idStr.includes('-')) {
            const numericId = parseInt(idStr);
            console.log('✅ Adding numeric main purpose ID:', numericId);
            achievedMainPurposes.push(numericId);
          } else if (idStr.includes('-')) {
            // UUIDの場合はそのまま文字列として保存
            console.log('✅ Adding UUID main purpose ID:', idStr);
            achievedMainPurposes.push(idStr);
          } else {
            console.log('❌ Skipping invalid main ID:', idStr);
          }
        } else if (key.startsWith('sub_')) {
          const idStr = key.replace('sub_', '');
          console.log('Sub purpose ID:', idStr);
          
          // 無効なIDをスキップ
          if (!idStr || idStr === 'null' || idStr === 'undefined') {
            console.log('Skipping invalid sub ID:', idStr);
            return;
          }
          
          // 数値ID、UUID、カスタムIDに対応
          if (!isNaN(idStr) && !idStr.includes('-')) {
            achievedSubPurposes.push(parseInt(idStr));
          } else if (idStr.startsWith('custom_')) {
            // カスタムサブ目的の場合は文字列IDとして保存
            achievedSubPurposes.push(idStr);
          } else if (idStr.includes('-')) {
            // UUIDの場合はそのまま文字列として保存
            console.log('✅ Adding UUID sub purpose ID:', idStr);
            achievedSubPurposes.push(idStr);
          } else {
            console.log('Skipping invalid sub ID:', idStr);
          }
        }
      });

      const reviewData = {
        trip_id: tripId,
        achieved_main_purposes: achievedMainPurposes,
        achieved_sub_purposes: achievedSubPurposes,
        used_items: usedItemsList,
        review_date: new Date().toISOString()
      };
      
      console.log('Final review data to save:', reviewData);

      // UPSERTを使用して確実に保存
      const { data, error } = await supabase
        .from('trip_reviews')
        .upsert(reviewData, {
          onConflict: 'trip_id'
        })
        .select();

      console.log('Upsert result:', { data, error });

      if (error) throw error;

      alert('レビューを保存しました！');
    } catch (error) {
      console.error('レビュー保存エラー:', error);
      alert('レビューの保存に失敗しました: ' + error.message);
    }
  };

  // 目的の達成状態を切り替え
  const togglePurposeAchievement = (purposeId, type) => {
    // 無効なIDをチェック
    if (!purposeId || purposeId === null || purposeId === 'null' || purposeId === 'undefined') {
      console.warn('Invalid purpose ID:', purposeId);
      return;
    }
    
    const key = `${type}_${purposeId}`;
    console.log('Toggling achievement for key:', key);
    
    const newAchieved = new Set(achievedPurposes);
    
    if (newAchieved.has(key)) {
      newAchieved.delete(key);
      console.log('Removed achievement:', key);
    } else {
      newAchieved.add(key);
      console.log('Added achievement:', key);
    }
    
    setAchievedPurposes(newAchieved);
  };

  // 持ち物の使用状態を切り替え
  const toggleItemUsage = (itemId, itemName) => {
    const newUsed = new Set(usedItems);
    
    // 同じ名前の全てのアイテムの使用状態を同期
    const sameNameItems = plannedItems.filter(item => item.name === itemName);
    
    if (newUsed.has(itemId)) {
      // 同じ名前の全てのアイテムを未使用にする
      sameNameItems.forEach(item => {
        newUsed.delete(item.id);
      });
    } else {
      // 同じ名前の全てのアイテムを使用済みにする
      sameNameItems.forEach(item => {
        newUsed.add(item.id);
      });
    }
    
    setUsedItems(newUsed);
  };

  // 達成率の計算
  const calculateAchievementRates = () => {
    const mainAchieved = plannedPurposes.main.filter(p => 
      achievedPurposes.has(`main_${p.id}`)
    ).length;
    const subAchieved = plannedPurposes.sub.filter(p => 
      achievedPurposes.has(`sub_${p.id}`)
    ).length;
    
    // 持ち物の使用数は重複を除いた名前でカウント
    const uniqueItemNames = [...new Set(plannedItems.map(item => item.name))];
    const itemsUsed = uniqueItemNames.filter(name => {
      // その名前の持ち物のいずれかが使用されているかチェック
      return plannedItems.some(item => item.name === name && usedItems.has(item.id));
    }).length;

    return {
      mainRate: plannedPurposes.main.length > 0 
        ? Math.round((mainAchieved / plannedPurposes.main.length) * 100) 
        : 0,
      subRate: plannedPurposes.sub.length > 0 
        ? Math.round((subAchieved / plannedPurposes.sub.length) * 100) 
        : 0,
      itemsRate: uniqueItemNames.length > 0 
        ? Math.round((itemsUsed / uniqueItemNames.length) * 100) 
        : 0,
      mainAchieved,
      mainTotal: plannedPurposes.main.length,
      subAchieved,
      subTotal: plannedPurposes.sub.length,
      itemsUsed,
      itemsTotal: uniqueItemNames.length
    };
  };

  const rates = calculateAchievementRates();

  // レンダリング時の状態をログ出力
  console.log('=== RENDERING TRIP REVIEW ===');
  console.log('Current achievedPurposes:', Array.from(achievedPurposes));
  console.log('Current usedItems:', Array.from(usedItems));
  console.log('Planned main purposes:', plannedPurposes.main);
  console.log('Planned sub purposes:', plannedPurposes.sub);
  console.log('Loading state:', loading);

  // チャートデータの準備
  const overallDoughnutData = {
    labels: ['達成', '未達成'],
    datasets: [{
      data: [
        Math.round((rates.mainRate + rates.subRate + rates.itemsRate) / 3),
        100 - Math.round((rates.mainRate + rates.subRate + rates.itemsRate) / 3)
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(201, 203, 207, 0.3)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(201, 203, 207, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const mainPurposeDoughnutData = {
    labels: ['達成', '未達成'],
    datasets: [{
      data: [rates.mainAchieved, rates.mainTotal - rates.mainAchieved],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 99, 132, 0.2)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 99, 132, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const subPurposeDoughnutData = {
    labels: ['達成', '未達成'],
    datasets: [{
      data: [rates.subAchieved, rates.subTotal - rates.subAchieved],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(54, 162, 235, 0.2)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(54, 162, 235, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const itemsDoughnutData = {
    labels: ['使用', '未使用'],
    datasets: [{
      data: [rates.itemsUsed, rates.itemsTotal - rates.itemsUsed],
      backgroundColor: [
        'rgba(255, 206, 86, 0.8)',
        'rgba(255, 206, 86, 0.2)'
      ],
      borderColor: [
        'rgba(255, 206, 86, 1)',
        'rgba(255, 206, 86, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: '旅の達成度'
      }
    }
  };

  if (loading) {
    return <div>レビューデータを読み込み中...</div>;
  }

  // 計画中の場合はレビュー不可
  if (tripStatus === 'planning') {
    return (
      <div className="review-section">
        <h3>🎯 旅の振り返り</h3>
        <div className="review-not-available">
          <p>この旅はまだ計画中です。</p>
          <p>旅が完了したら、振り返りレビューができるようになります。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-section">
      <h3>🎯 旅の振り返り</h3>
      
      {/* 達成度サマリー */}
      <div className="achievement-summary">
        <div className="summary-card">
          <h4>総合達成度</h4>
          <div className="percentage">
            {Math.round((rates.mainRate + rates.subRate + rates.itemsRate) / 3)}%
          </div>
        </div>
        <div className="summary-card">
          <h4>メイン目的</h4>
          <div className="percentage">{rates.mainRate}%</div>
          <div className="count">{rates.mainAchieved}/{rates.mainTotal}</div>
        </div>
        <div className="summary-card">
          <h4>サブ目的</h4>
          <div className="percentage">{rates.subRate}%</div>
          <div className="count">{rates.subAchieved}/{rates.subTotal}</div>
        </div>
        <div className="summary-card">
          <h4>持ち物活用</h4>
          <div className="percentage">{rates.itemsRate}%</div>
          <div className="count">{rates.itemsUsed}/{rates.itemsTotal}</div>
        </div>
      </div>

      {/* メイン目的の達成チェック */}
      {plannedPurposes.main.length > 0 && (
        <div className="review-purposes">
          <h4>メイン目的の達成度</h4>
          <div className="checklist">
            {plannedPurposes.main.map(purpose => {
              const key = `main_${purpose.id}`;
              const isChecked = achievedPurposes.has(key);
              console.log(`🎯 Rendering main purpose: ${purpose.name}`);
              console.log(`   Purpose ID: ${purpose.id} (type: ${typeof purpose.id})`);
              console.log(`   Key: ${key}`);  
              console.log(`   isChecked: ${isChecked}`);
              console.log(`   achievedPurposes contains: ${Array.from(achievedPurposes).join(', ')}`);
              
              return (
                <label key={key} className="review-checkbox">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePurposeAchievement(purpose.id, 'main')}
                  />
                  <span>{purpose.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* サブ目的の達成チェック */}
      {plannedPurposes.sub.length > 0 && (
        <div className="review-purposes">
          <h4>サブ目的の達成度</h4>
          <div className="checklist">
            {plannedPurposes.sub.map(purpose => {
              const key = `sub_${purpose.id}`;
              const isChecked = achievedPurposes.has(key);
              console.log(`Rendering sub purpose: ${purpose.name} (${key}) - checked: ${isChecked} - isCustom: ${purpose.isCustom}`);
              
              return (
                <label key={key} className="review-checkbox">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePurposeAchievement(purpose.id, 'sub')}
                  />
                  <span>{purpose.name}</span>
                  {purpose.isCustom && <span className="custom-badge">カスタム</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 持ち物の活用度 */}
      <div className="review-items">
        <h4>持ち物の活用度 <span style={{fontSize: '0.8em', color: '#666'}}>（活用したものにチェック）</span></h4>
        {plannedItems.length > 0 ? (
          <div className="checklist">
            {plannedItems
              .filter(item => item.name && item.name.trim() !== '') // 空のアイテムを除外
              .filter((item, index, self) => {
                // 重複を除去: 同じ名前の最初のアイテムのみを残す
                return index === self.findIndex(i => i.name === item.name);
              })
              .map(item => {
                console.log('🔍 TripReview - Rendering item:', item);
                return (
                  <label key={`item_${item.id}`} className="review-checkbox">
                    <input
                      type="checkbox"
                      checked={usedItems.has(item.id)}
                      onChange={() => toggleItemUsage(item.id, item.name)}
                    />
                    <span>{item.name}</span>
                    {item.type === 'custom' && <span className="custom-badge">カスタム</span>}
                  </label>
                );
              })}
          </div>
        ) : (
          <div className="no-items-message" style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center',
            margin: '10px 0'
          }}>
            <p style={{ margin: 0, color: '#6c757d' }}>
              📝 チェック済みの持ち物がありません<br/>
              「持ち物」タブでおすすめの持ち物にチェックを入れるか、<br/>
              カスタム持ち物を追加してから保存してください。
            </p>
          </div>
        )}
      </div>

      {/* チャート表示切り替えボタン */}
      <button 
        className="btn-primary"
        onClick={() => setShowCharts(!showCharts)}
      >
        🎯 旅の振り返り
      </button>

      {/* チャート表示 */}
      {showCharts && (
        <div className="charts-container">
          <div className="chart-wrapper">
            <h4>総合達成度</h4>
            <div style={{ height: '250px' }}>
              <Doughnut data={overallDoughnutData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-wrapper">
            <h4>メイン目的達成度</h4>
            <div style={{ height: '250px' }}>
              <Doughnut data={mainPurposeDoughnutData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-wrapper">
            <h4>サブ目的達成度</h4>
            <div style={{ height: '250px' }}>
              <Doughnut data={subPurposeDoughnutData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-wrapper">
            <h4>持ち物活用度</h4>
            <div style={{ height: '250px' }}>
              <Doughnut data={itemsDoughnutData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <div className="review-actions">
        <button className="btn-primary" onClick={saveReviewData}>
          💾 レビューを保存
        </button>
        <button className="btn-secondary" onClick={async () => {
          if (window.confirm('レビューデータをリセットしますか？')) {
            await supabase.from('trip_reviews').delete().eq('trip_id', tripId);
            setAchievedPurposes(new Set());
            setUsedItems(new Set());
            alert('リセットしました');
          }
        }}>
          🔄 リセット
        </button>
      </div>
    </div>
  );
};

export default TripReview;