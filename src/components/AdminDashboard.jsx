// 管理ダッシュボード（読み取り専用版）
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.js コンポーネント登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    recentTrips: [],
    popularDestinations: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // 60秒ごとに更新（本番環境への負荷を最小限に）
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // ユーザー数取得（READ ONLY）
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // 旅行記録数取得（READ ONLY）
      const { count: tripCount, error: tripError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });

      if (tripError) throw tripError;

      // 最近の旅行記録（最新5件）
      const { data: recentTrips, error: recentError } = await supabase
        .from('trips')
        .select('id, title, destination, start_date')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // 人気の目的地（集計）
      const { data: allTrips, error: destError } = await supabase
        .from('trips')
        .select('destination');

      if (destError) throw destError;

      // 目的地を集計
      const destinationCounts = {};
      allTrips?.forEach(trip => {
        if (trip.destination) {
          destinationCounts[trip.destination] = (destinationCounts[trip.destination] || 0) + 1;
        }
      });

      const popularDestinations = Object.entries(destinationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setStats({
        totalUsers: userCount || 0,
        totalTrips: tripCount || 0,
        recentTrips: recentTrips || [],
        popularDestinations: popularDestinations
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // グラフデータ準備
  const userStatsData = {
    labels: ['登録ユーザー', '旅行記録'],
    datasets: [{
      label: '件数',
      data: [stats.totalUsers, stats.totalTrips],
      backgroundColor: [
        'rgba(54, 162, 235, 0.5)',
        'rgba(75, 192, 192, 0.5)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };

  const destinationData = {
    labels: stats.popularDestinations.map(d => d.name),
    datasets: [{
      label: '訪問回数',
      data: stats.popularDestinations.map(d => d.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)'
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>管理画面を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#f44336' }}>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>再試行</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '20px'
      }}>
        <h1>📊 管理ダッシュボード（読み取り専用）</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          最終更新: {lastUpdate.toLocaleString('ja-JP')}
        </div>
      </div>

      {/* 統計カード */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            登録ユーザー数
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            旅行記録数
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
            {stats.totalTrips}
          </div>
        </div>
      </div>

      {/* グラフエリア */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>統計サマリー</h3>
          <div style={{ height: '300px' }}>
            <Bar data={userStatsData} options={chartOptions} />
          </div>
        </div>

        {stats.popularDestinations.length > 0 && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>人気の目的地 TOP5</h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={destinationData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* 最近の旅行記録 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>最近の旅行記録</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>タイトル</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>目的地</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>出発日</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTrips.map((trip, index) => (
                <tr key={trip.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px' }}>{trip.title}</td>
                  <td style={{ padding: '10px' }}>{trip.destination || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    {trip.start_date ? new Date(trip.start_date).toLocaleDateString('ja-JP') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#FFF3E0',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        ⚠️ このダッシュボードは読み取り専用です。データの変更や削除はできません。
      </div>
    </div>
  );
}

export default AdminDashboard;