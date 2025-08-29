import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PurposeSelector = ({ tripId, onPurposeSelect }) => {
  const [mainPurposes, setMainPurposes] = useState([]);
  const [subPurposes, setSubPurposes] = useState([]);
  const [selectedMain, setSelectedMain] = useState([]);
  const [selectedSub, setSelectedSub] = useState([]);
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    fetchPurposes();
  }, []);

  const fetchPurposes = async () => {
    try {
      // メイン目的を取得
      const { data: mainData, error: mainError } = await supabase
        .from('main_purposes')
        .select('*')
        .order('display_order');

      if (mainError) throw mainError;
      setMainPurposes(mainData || []);

      // サブ目的を取得
      const { data: subData, error: subError } = await supabase
        .from('sub_purposes')
        .select('*')
        .order('display_order');

      if (subError) throw subError;
      setSubPurposes(subData || []);
    } catch (error) {
      console.error('目的データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>目的データを読み込み中...</div>;
  }

  return (
    <div className="purpose-selector">
      <h3>旅の目的を選択</h3>
      
      {/* メイン目的 */}
      <div className="purpose-section">
        <h4>メイン目的</h4>
        <div className="purpose-grid">
          {mainPurposes.map(purpose => (
            <label key={purpose.id} className="purpose-item">
              <input
                type="checkbox"
                checked={selectedMain.includes(purpose.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMain([...selectedMain, purpose.id]);
                  } else {
                    setSelectedMain(selectedMain.filter(id => id !== purpose.id));
                  }
                }}
              />
              <span>{purpose.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* サブ目的 */}
      <div className="purpose-section">
        <h4>サブ目的（立ち寄りスポット）</h4>
        <div className="purpose-grid">
          {subPurposes.map(purpose => (
            <label key={purpose.id} className="purpose-item">
              <input
                type="checkbox"
                checked={selectedSub.includes(purpose.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSub([...selectedSub, purpose.id]);
                  } else {
                    setSelectedSub(selectedSub.filter(id => id !== purpose.id));
                  }
                }}
              />
              <span>{purpose.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PurposeSelector;