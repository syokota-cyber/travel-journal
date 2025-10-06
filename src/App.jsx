// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TripList from './components/TripList';
import TripDetail from './components/TripDetail';
import TripForm from './components/TripForm';
import Auth from './components/Auth';
import Footer from './components/Footer';
import AccountSettings from './components/AccountSettings';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import LanguageSwitcher from './components/LanguageSwitcher';
import { enforceHTTPS, validateEnvironment, checkSecurityHeaders } from './utils/security';

// メインアプリコンポーネント（認証後）
function AppContent() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // データ取得
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('旅行データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  const handleBack = () => {
    setSelectedTrip(null);
  };

  const handleCreateTrip = (defaultDate = null) => {
    setEditingTrip(null);
    setShowCreateForm(true);
    
    // デフォルト日付が指定されている場合は、一時的な編集用オブジェクトを作成
    if (defaultDate) {
      // ローカルタイムゾーンで日付を処理
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const startDateStr = `${year}-${month}-${day}`;
      
      // 翌日を計算
      const nextDay = new Date(defaultDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDayNum = String(nextDay.getDate()).padStart(2, '0');
      const endDateStr = `${nextYear}-${nextMonth}-${nextDayNum}`;
      
      setEditingTrip({
        defaultStartDate: startDateStr,
        defaultEndDate: endDateStr
      });
    }
  };

  const handleSaveTrip = async (tripData, isEdit = false) => {
    try {
      if (isEdit) {
        // 編集モード：既存の旅行を更新
        const { data, error } = await supabase
          .from('trips')
          .update({
            title: tripData.title,
            destination: tripData.destination,
            start_date: tripData.start_date,
            end_date: tripData.end_date,
            status: tripData.status
          })
          .eq('id', tripData.id)
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          setTrips(prev => prev.map(trip => 
            trip.id === tripData.id ? data[0] : trip
          ));
          if (selectedTrip && selectedTrip.id === tripData.id) {
            setSelectedTrip(data[0]);
          }
        }
        setEditingTrip(null);
        setShowCreateForm(false);
      } else {
        // 新規作成モード
        const { data, error } = await supabase
          .from('trips')
          .insert([{
            title: tripData.title,
            destination: tripData.destination,
            start_date: tripData.startDate,
            end_date: tripData.endDate,
            status: tripData.status,
            user_id: user?.id
          }])
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          setTrips(prev => [data[0], ...prev]);
          // 新規作成後は詳細画面に遷移
          setSelectedTrip(data[0]);
        }
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('旅行保存エラー:', error);
      alert(`旅行の保存に失敗しました: ${error.message}`);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setEditingTrip(null);
  };

  const handleUpdateTrip = (updatedTrip) => {
    setTrips(prev => prev.map(trip => 
      trip.id === updatedTrip.id ? updatedTrip : trip
    ));
    setSelectedTrip(updatedTrip);
  };

  const handleDeleteTrip = () => {
    if (selectedTrip) {
      setTrips(prev => prev.filter(trip => trip.id !== selectedTrip.id));
      setSelectedTrip(null);
    }
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setShowCreateForm(true);
    setSelectedTrip(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{t('app.title')}</h1>
        <div className="header-controls">
          <LanguageSwitcher className="header-language-switcher" />
          {/* 管理者のみ表示 */}
          {user?.email === 'shin1yokota@gmail.com' && (
            <button 
              onClick={() => setShowAdminDashboard(true)} 
              className="btn-text"
            >
              {t('navigation.admin_dashboard')}
            </button>
          )}
          <button 
            onClick={() => setShowAccountSettings(true)} 
            className="btn-text"
          >
            {t('navigation.settings')}
          </button>
          <button onClick={signOut} className="btn-text">
            {t('app.logout')}
          </button>
        </div>
      </header>

      <main className="App-main">
        {loading ? (
          <div>{t('app.loading')}</div>
        ) : showAdminDashboard ? (
          <>
            <button 
              onClick={() => setShowAdminDashboard(false)}
              className="btn-secondary"
              style={{ marginBottom: '20px' }}
            >
              ← 旅行記録に戻る
            </button>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </>
        ) : showCreateForm ? (
          <TripForm
            onSave={handleSaveTrip}
            onCancel={handleCancelCreate}
            editTrip={editingTrip}
            existingTrips={trips}
          />
        ) : selectedTrip ? (
          <TripDetail 
            trip={selectedTrip} 
            onBack={handleBack}
            onUpdate={handleUpdateTrip}
            onDelete={handleDeleteTrip}
            onEdit={handleEditTrip}
          />
        ) : (
          <TripList 
            trips={trips} 
            onSelectTrip={handleSelectTrip}
            onCreateTrip={handleCreateTrip}
          />
        )}
      </main>
      <Footer />
      
      {/* アカウント設定モーダル */}
      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}
    </div>
  );
}

// メインのAppコンポーネント
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// 認証状態に応じて表示を切り替える
function AppWithAuth() {
  const { user, loading } = useAuth();

  // セキュリティ初期化
  useEffect(() => {
    try {
      // HTTPS強制リダイレクト
      enforceHTTPS();
      
      // 環境変数の検証
      validateEnvironment();
      
      // セキュリティヘッダーの確認（開発時のみ）
      checkSecurityHeaders();
    } catch (error) {
      console.error('Security initialization error:', error);
      // 本番環境でのエラーは隠す
      if (process.env.NODE_ENV === 'production') {
        alert('アプリケーションの読み込みに問題が発生しました。ページを再読み込みしてください。');
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="App">
        <div className="App-main">
          <div>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return user ? <AppContent /> : <Auth />;
}

export default App;
