// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function TripList({ trips, onSelectTrip, onCreateTrip }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tripUsage, setTripUsage] = useState({ monthlyCount: {}, yearlyTotal: 0 });
  const [canCreateTrip, setCanCreateTrip] = useState(false);
  const [tripEvaluations, setTripEvaluations] = useState({});
  const { user } = useAuth();

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  useEffect(() => {
    if (trips && user) {
      calculateUsage();
      fetchTripEvaluations();
    }
  }, [trips, selectedYear, user]);
  
  // 評価の再計算を定期的に実行（レビュー更新時の反映のため）
  useEffect(() => {
    if (trips && user) {
      const interval = setInterval(() => {
        fetchTripEvaluations();
      }, 3000); // 3秒ごとに評価を再取得
      
      return () => clearInterval(interval);
    }
  }, [trips, user]);

  // 完了した旅行の総合評価を取得
  const fetchTripEvaluations = async () => {
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    if (completedTrips.length === 0) return;

    const evaluations = {};

    for (const trip of completedTrips) {
      try {
        // 計画された目的を取得
        const { data: purposeData } = await supabase
          .from('trip_purposes')
          .select('purpose_type')
          .eq('trip_id', trip.id);

        // レビューデータを取得
        const { data: reviewDataArray, error: reviewError } = await supabase
          .from('trip_reviews')
          .select('achieved_main_purposes, achieved_sub_purposes')
          .eq('trip_id', trip.id);
          
        const reviewData = reviewDataArray && reviewDataArray.length > 0 ? reviewDataArray[0] : null;

        if (purposeData) {
          const plannedMain = purposeData.filter(p => p.purpose_type === 'main').length;
          const plannedSub = purposeData.filter(p => p.purpose_type === 'sub' || p.purpose_type === 'custom').length;
          
          console.log(`📊 Trip ${trip.id} planned: main=${plannedMain}, sub=${plannedSub} (including custom spots)`);
          
          if (reviewData && !reviewError) {
            // レビューデータがある場合
            const achievedMain = reviewData.achieved_main_purposes?.length || 0;
            const achievedSub = reviewData.achieved_sub_purposes?.length || 0;
            
            console.log(`📊 Trip ${trip.id} achieved: main=${achievedMain}, sub=${achievedSub}`);
            console.log(`📊 Trip ${trip.id} sub purposes:`, reviewData.achieved_sub_purposes);

            // 達成率計算
            const mainRate = plannedMain > 0 ? Math.round((achievedMain / plannedMain) * 100) : 0;
            const subRate = plannedSub > 0 ? Math.round((achievedSub / plannedSub) * 100) : 0;
            
            console.log(`📊 Trip ${trip.id} rates: main=${mainRate}%, sub=${subRate}%`);
            
            // 総合達成度計算（TripReview.jsxと同じ計算式）
            // メイン70%、サブ30%の加重平均
            const overallPercentage = Math.round(mainRate * 0.7 + subRate * 0.3);
            
            console.log(`📊 Trip ${trip.id} overall: ${overallPercentage}%`);

            evaluations[trip.id] = {
              mainRate: Math.max(0, Math.min(100, mainRate)),
              subRate: Math.max(0, Math.min(100, subRate)),
              overallPercentage  // パーセンテージを直接保存
            };
          } else {
            // レビューデータがない場合は評価なし
            evaluations[trip.id] = {
              mainRate: 0,
              subRate: 0,
              overallPercentage: 0
            };
          }
        }
      } catch (error) {
        console.error(`旅行${trip.id}の評価取得エラー:`, error);
      }
    }

    setTripEvaluations(evaluations);
  };

  // 利用制限の計算
  const calculateUsage = () => {
    const yearTrips = trips.filter(trip => {
      const tripDate = trip.start_date ? new Date(trip.start_date) : new Date(trip.created_at);
      const tripYear = tripDate.getFullYear();
      return tripYear === selectedYear;
    });

    const monthlyCount = {};
    let yearlyTotal = 0;

    yearTrips.forEach(trip => {
      const tripDate = trip.start_date ? new Date(trip.start_date) : new Date(trip.created_at);
      const month = tripDate.getMonth(); // 0-11
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      yearlyTotal++;
    });

    // 現在の月の旅行数を確認
    const currentMonth = new Date().getMonth();
    const currentMonthCount = monthlyCount[currentMonth] || 0;
    
    // 新規作成可能かチェック（月2回まで、年間24件まで）
    const canCreate = currentMonthCount < 2 && yearlyTotal < 24;

    setTripUsage({ monthlyCount, yearlyTotal });
    setCanCreateTrip(canCreate);
  };

  // 月ごとの旅行を取得
  const getTripsByMonth = (monthIndex) => {
    return trips.filter(trip => {
      const tripDate = trip.start_date ? new Date(trip.start_date) : new Date(trip.created_at);
      return tripDate.getFullYear() === selectedYear && tripDate.getMonth() === monthIndex;
    }).sort((a, b) => {
      // 日付の早い順に並べる
      const dateA = a.start_date ? new Date(a.start_date) : new Date(a.created_at);
      const dateB = b.start_date ? new Date(b.start_date) : new Date(b.created_at);
      return dateA - dateB;
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      planning: '📝',
      ongoing: '🚗',
      completed: '📒'
    };
    return icons[status] || '📝';
  };

  // パーセント評価を表示（パーセンテージを直接受け取る）
  const renderPercentageRating = (percentage) => {
    console.log('🎯 renderPercentageRating called with percentage:', percentage);
    // 境界値チェック
    if (percentage === undefined || percentage === null || percentage < 0 || percentage > 100 || isNaN(percentage)) {
      console.log('❌ Invalid percentage, returning null');
      return null;
    }
    
    return (
      <span 
        className="percentage-rating" 
        title={`達成度: ${percentage}%`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
        <span style={{ 
          fontSize: '0.7rem', 
          color: '#666',
          marginRight: '4px'
        }}>
          達成度
        </span>
        <span className="percentage-score" style={{
          fontWeight: 'bold',
          color: percentage >= 80 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#f44336'
        }}>
          {percentage}%
        </span>
        <span className="percentage-bar" style={{
          display: 'inline-block',
          width: '50px',
          height: '6px',
          backgroundColor: '#e0e0e0',
          borderRadius: '3px',
          position: 'relative'
        }}>
          <span style={{
            display: 'block',
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: percentage >= 80 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#f44336',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }}></span>
        </span>
      </span>
    );
  };

  const handleCreateTrip = (specificMonth = null) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // 特定の月が指定されている場合
    if (specificMonth !== null && selectedYear === currentYear) {
      const monthCount = tripUsage.monthlyCount[specificMonth] || 0;
      if (monthCount >= 2) {
        alert(`${specificMonth + 1}月は既に2件の旅行が登録されています。`);
        return;
      }
      if (tripUsage.yearlyTotal >= 24) {
        alert('年間利用制限（24件）に達しています。');
        return;
      }
      
      // 特定の月の日付を事前設定してフォームを開く
      const defaultDate = new Date(selectedYear, specificMonth, 1);
      onCreateTrip(defaultDate);
      return;
    }
    
    // 通常の新規作成（一番近い空いている月を探す）
    if (tripUsage.yearlyTotal >= 24) {
      alert('年間利用制限（24件）に達しています。');
      return;
    }
    
    // 選択されている年の現在月から順に空いている月を探す
    let targetMonth = null;
    let targetYear = selectedYear;
    let found = false;
    
    // 選択年が現在年の場合は現在月から、過去年の場合は1月から探す
    const startMonth = selectedYear === currentYear ? currentMonth : 0;
    
    for (let i = 0; i < 12; i++) {
      const checkMonth = (startMonth + i) % 12;
      
      // 未来の月は対象外（現在年の場合のみ）
      if (selectedYear === currentYear && checkMonth < currentMonth && i > 0) continue;
      
      const monthCount = tripUsage.monthlyCount[checkMonth] || 0;
      if (monthCount < 2 && tripUsage.yearlyTotal < 24) {
        targetMonth = checkMonth;
        targetYear = selectedYear;
        found = true;
        break;
      }
    }
    
    if (found) {
      const defaultDate = new Date(targetYear, targetMonth, 1);
      onCreateTrip(defaultDate);
    } else {
      // 空いている月が見つからない場合
      if (selectedYear === currentYear) {
        alert('今年はすべての月で2件の旅行が登録されています。');
      } else {
        // デフォルトの日付で作成画面を開く
        onCreateTrip();
      }
    }
  };

  return (
    <div className="trip-calendar">
      <div className="calendar-header">
        <div className="year-selector">
          <button 
            className="year-nav-btn"
            onClick={() => setSelectedYear(selectedYear - 1)}
          >
            ◀
          </button>
          <h2>{selectedYear}年 Annual Travel Calendar</h2>
          <button 
            className="year-nav-btn"
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
          >
            ▶
          </button>
        </div>
        
        <button 
          className={`btn-primary ${tripUsage.yearlyTotal >= 24 ? 'disabled' : ''}`} 
          onClick={handleCreateTrip}
          disabled={tripUsage.yearlyTotal >= 24}
          title={tripUsage.yearlyTotal >= 24 ? '年間利用制限に達しています' : '新しい旅行を計画'}
        >
          + 新しい旅行を計画
        </button>
      </div>

      <div className="calendar-grid">
        {months.map((month, index) => {
          const monthTrips = getTripsByMonth(index);
          const monthCount = tripUsage.monthlyCount[index] || 0;
          const isCurrentMonth = index === new Date().getMonth() && selectedYear === new Date().getFullYear();
          
          return (
            <div key={index} className={`month-cell ${isCurrentMonth ? 'current-month' : ''}`}>
              <div className="month-header">
                <h3>{month}</h3>
                <span className={`month-count ${monthCount >= 2 ? 'limit-reached' : ''}`}>
                  {monthCount}/2
                </span>
              </div>
              
              <div className="month-trips">
                {monthTrips.length === 0 ? (
                  <>
                    <div className="no-trips">予定なし</div>
                    {monthCount < 2 && tripUsage.yearlyTotal < 24 && selectedYear >= new Date().getFullYear() && (
                      <button 
                        className="add-trip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTrip(index);
                        }}
                        title={`${month}に旅行を追加`}
                      >
                        プラン追加
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {monthTrips.map(trip => {
                      const evaluation = tripEvaluations[trip.id];
                      console.log('🔍 Trip:', trip.title, 'Evaluation:', evaluation);
                      return (
                        <div 
                          key={trip.id} 
                          className="trip-item"
                          onClick={() => onSelectTrip(trip)}
                          title={trip.title}
                        >
                          <span className="trip-icon">{getStatusIcon(trip.status)}</span>
                          <div className="trip-content">
                            <span className="trip-title">{trip.title}</span>
                            {trip.start_date && (
                              <span className="trip-date">
                                {new Date(trip.start_date).getDate()}日
                                {trip.end_date && trip.start_date !== trip.end_date && 
                                  `-${new Date(trip.end_date).getDate()}日`
                                }
                              </span>
                            )}
                            {trip.status === 'completed' && evaluation && 
                             evaluation.overallPercentage > 0 && 
                             !isNaN(evaluation.overallPercentage) && (
                              <div className="trip-evaluation">
                                {renderPercentageRating(evaluation.overallPercentage)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {monthCount === 1 && tripUsage.yearlyTotal < 24 && selectedYear >= new Date().getFullYear() && (
                      <button 
                        className="add-trip-btn small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTrip(index);
                        }}
                        title={`${month}に2つ目の旅行を追加`}
                      >
                        2つ目のプラン追加
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default TripList;