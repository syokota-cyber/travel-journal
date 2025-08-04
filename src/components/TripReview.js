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
    if (tripId) {
      fetchPlannedData();
      fetchReviewData();
    }
  }, [tripId]);

  // 計画データの取得
  const fetchPlannedData = async () => {
    try {
      // 計画された目的を取得
      const { data: purposeData, error: purposeError } = await supabase
        .from('trip_purposes')
        .select(`
          purpose_type,
          main_purpose_id,
          sub_purpose_id,
          main_purposes!trip_purposes_main_purpose_id_fkey(id, name),
          sub_purposes!trip_purposes_sub_purpose_id_fkey(id, name)
        `)
        .eq('trip_id', tripId);

      if (purposeError) throw purposeError;

      const mainPurposes = [];
      const subPurposes = [];

      purposeData?.forEach(item => {
        if (item.purpose_type === 'main' && item.main_purposes) {
          mainPurposes.push({
            id: item.main_purpose_id,
            name: item.main_purposes.name
          });
        } else if (item.purpose_type === 'sub' && item.sub_purposes) {
          subPurposes.push({
            id: item.sub_purpose_id,
            name: item.sub_purposes.name
          });
        }
      });

      // カスタムサブ目的を追加
      const allSubPurposes = [...subPurposes];
      if (selectedPurposes.customSub) {
        selectedPurposes.customSub.forEach(customSub => {
          allSubPurposes.push({
            id: customSub.id,
            name: customSub.name,
            isCustom: true
          });
        });
      }

      setPlannedPurposes({ main: mainPurposes, sub: allSubPurposes });

      // メイン目的に基づいて推奨持ち物を取得
      if (mainPurposes.length > 0) {
        const mainPurposeIds = mainPurposes.map(p => p.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('default_items')
          .select('*')
          .in('main_purpose_id', mainPurposeIds)
          .order('display_order');

        if (itemsError) throw itemsError;

        // 重複を排除
        const uniqueItems = new Map();
        itemsData?.forEach(item => {
          const key = `${item.main_purpose_id}_${item.name}`;
          if (!uniqueItems.has(key)) {
            uniqueItems.set(key, {
              id: item.id,
              name: item.name,
              type: 'default',
              main_purpose_id: item.main_purpose_id
            });
          }
        });

        // カスタムアイテムをtrip_checklistsから取得
        const { data: customItemsData, error: customItemsError } = await supabase
          .from('trip_checklists')
          .select('*')
          .eq('trip_id', tripId)
          .eq('is_custom', true);

        if (customItemsError) {
          console.error('カスタムアイテム取得エラー:', customItemsError);
        }

        const customItems = customItemsData?.map(item => ({
          id: `custom_${item.id}`,
          name: item.item_name,
          type: 'custom',
          isCustom: true
        })) || [];

        setPlannedItems([...Array.from(uniqueItems.values()), ...customItems]);
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
      console.log('Fetching review data for trip:', tripId);
      
      // trip_reviewsテーブルからレビューデータを取得
      const { data, error } = await supabase
        .from('trip_reviews')
        .select('*')
        .eq('trip_id', tripId)
        .single();
      
      console.log('Review fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') { // データが見つからない場合のエラーコードを除外
        throw error;
      }

      if (data) {
        // 保存されたレビューデータを復元
        const achievedSet = new Set();
        const usedSet = new Set();

        if (data.achieved_main_purposes) {
          data.achieved_main_purposes.forEach(id => achievedSet.add(`main_${id}`));
        }
        if (data.achieved_sub_purposes) {
          data.achieved_sub_purposes.forEach(id => achievedSet.add(`sub_${id}`));
        }
        if (data.used_items) {
          data.used_items.forEach(id => usedSet.add(id));
        }

        setAchievedPurposes(achievedSet);
        setUsedItems(usedSet);
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
      console.log('Saving review data for trip:', tripId);
      
      const achievedMainPurposes = [];
      const achievedSubPurposes = [];
      const usedItemsList = Array.from(usedItems);

      // 達成した目的を分類
      achievedPurposes.forEach(key => {
        if (key.startsWith('main_')) {
          achievedMainPurposes.push(parseInt(key.replace('main_', '')));
        } else if (key.startsWith('sub_')) {
          achievedSubPurposes.push(parseInt(key.replace('sub_', '')));
        }
      });

      const reviewData = {
        trip_id: tripId,
        achieved_main_purposes: achievedMainPurposes,
        achieved_sub_purposes: achievedSubPurposes,
        used_items: usedItemsList,
        review_date: new Date().toISOString()
      };
      
      console.log('Review data to save:', reviewData);

      // まずはINSERTを試し、失敗したらUPDATEを試す
      const { data: insertData, error: insertError } = await supabase
        .from('trip_reviews')
        .insert(reviewData)
        .select();

      console.log('Insert result:', { insertData, insertError });

      if (insertError) {
        console.log('Insert failed, trying update...');
        // INSERT失敗時はUPDATEを試行
        const { data: updateData, error: updateError } = await supabase
          .from('trip_reviews')
          .update({
            achieved_main_purposes: achievedMainPurposes,
            achieved_sub_purposes: achievedSubPurposes,
            used_items: usedItemsList,
            review_date: new Date().toISOString()
          })
          .eq('trip_id', tripId)
          .select();

        console.log('Update result:', { updateData, updateError });

        if (updateError) throw updateError;
      }

      alert('レビューを保存しました！');
    } catch (error) {
      console.error('レビュー保存エラー:', error);
      alert('レビューの保存に失敗しました');
    }
  };

  // 目的の達成状態を切り替え
  const togglePurposeAchievement = (purposeId, type) => {
    const key = `${type}_${purposeId}`;
    const newAchieved = new Set(achievedPurposes);
    
    if (newAchieved.has(key)) {
      newAchieved.delete(key);
    } else {
      newAchieved.add(key);
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
            {plannedPurposes.main.map(purpose => (
              <label key={`main_${purpose.id}`} className="review-checkbox">
                <input
                  type="checkbox"
                  checked={achievedPurposes.has(`main_${purpose.id}`)}
                  onChange={() => togglePurposeAchievement(purpose.id, 'main')}
                />
                <span>{purpose.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* サブ目的の達成チェック */}
      {plannedPurposes.sub.length > 0 && (
        <div className="review-purposes">
          <h4>サブ目的の達成度</h4>
          <div className="checklist">
            {plannedPurposes.sub.map(purpose => (
              <label key={`sub_${purpose.id}`} className="review-checkbox">
                <input
                  type="checkbox"
                  checked={achievedPurposes.has(`sub_${purpose.id}`)}
                  onChange={() => togglePurposeAchievement(purpose.id, 'sub')}
                />
                <span>{purpose.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 持ち物の活用度 */}
      {plannedItems.length > 0 && (
        <div className="review-items">
          <h4>持ち物の活用度</h4>
          <div className="checklist">
            {plannedItems
              .filter(item => item.name && item.name.trim() !== '') // 空のアイテムを除外
              .filter((item, index, self) => {
                // 重複を除去: 同じ名前の最初のアイテムのみを残す
                return index === self.findIndex(i => i.name === item.name);
              })
              .map(item => (
                <label key={`item_${item.id}`} className="review-checkbox">
                  <input
                    type="checkbox"
                    checked={usedItems.has(item.id)}
                    onChange={() => toggleItemUsage(item.id, item.name)}
                  />
                  <span>{item.name}</span>
                  {item.type === 'custom' && <span className="custom-badge">カスタム</span>}
                </label>
              ))}
          </div>
          {plannedItems.filter(item => item.name && item.name.trim() !== '').length === 0 && (
            <p className="no-items-message">持ち物が計画されていません。目的タブで目的を選択すると、おすすめの持ち物が表示されます。</p>
          )}
        </div>
      )}

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
      </div>
    </div>
  );
};

export default TripReview;