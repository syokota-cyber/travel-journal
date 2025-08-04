import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RulesConfirmation = ({ tripId, mainPurposeIds, onConfirmComplete }) => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [confirmations, setConfirmations] = useState({});
  const [allConfirmed, setAllConfirmed] = useState(false);

  useEffect(() => {
    if (tripId && mainPurposeIds && mainPurposeIds.length > 0) {
      fetchRules();
    }
  }, [tripId, mainPurposeIds]);

  useEffect(() => {
    checkAllConfirmed();
  }, [confirmations, rules]);

  // 該当するルール・マナーを取得
  const fetchRules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('travel_rules')
        .select('*')
        .in('main_purpose_id', mainPurposeIds)
        .order('rule_category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;

      // 重複を排除（rule_titleとrule_descriptionが同じものを除外）
      // ただし、最初に見つかったルールのIDを保持する
      const uniqueRules = [];
      const seen = new Map();
      
      data?.forEach(rule => {
        const key = `${rule.rule_title}_${rule.rule_description}`;
        if (!seen.has(key)) {
          seen.set(key, rule.id);
          uniqueRules.push(rule);
        }
      });

      setRules(uniqueRules);

      // 既存の確認状況を取得
      const { data: existingConfirmations, error: confirmError } = await supabase
        .from('trip_rule_confirmations')
        .select('rule_id, is_confirmed')
        .eq('trip_id', tripId);

      if (confirmError) throw confirmError;

      // 既存確認状況をセット
      const confirmationMap = {};
      existingConfirmations?.forEach(conf => {
        confirmationMap[conf.rule_id] = conf.is_confirmed;
      });
      
      setConfirmations(confirmationMap);

    } catch (error) {
      console.error('ルール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 確認状態を切り替え
  const toggleConfirmation = async (ruleId) => {
    const newConfirmed = !confirmations[ruleId];
    
    try {
      // まずローカル状態を更新（UIの応答性向上）
      setConfirmations(prev => ({
        ...prev,
        [ruleId]: newConfirmed
      }));

      // データベースに保存（upsertで重複エラーを回避）
      const { error } = await supabase
        .from('trip_rule_confirmations')
        .upsert({
          trip_id: tripId,
          rule_id: ruleId,
          is_confirmed: newConfirmed,
          confirmed_at: newConfirmed ? new Date().toISOString() : null
        }, {
          onConflict: 'trip_id,rule_id'
        });

      if (error) {
        // エラーが発生した場合は元に戻す
        console.error('確認状態更新エラー:', error);
        setConfirmations(prev => ({
          ...prev,
          [ruleId]: !newConfirmed
        }));
        alert('確認状態の更新に失敗しました');
      }

    } catch (error) {
      console.error('確認状態更新エラー:', error);
      // エラーが発生した場合は元に戻す
      setConfirmations(prev => ({
        ...prev,
        [ruleId]: !newConfirmed
      }));
      alert('確認状態の更新に失敗しました');
    }
  };

  // 全て確認済みかチェック
  const checkAllConfirmed = () => {
    const requiredRules = rules.filter(rule => rule.is_required);
    const allRequiredConfirmed = requiredRules.every(rule => 
      confirmations[rule.id] === true
    );
    
    setAllConfirmed(allRequiredConfirmed && requiredRules.length > 0);
  };

  // カテゴリ別にルールをグループ化
  const groupRulesByCategory = () => {
    const grouped = {};
    rules.forEach(rule => {
      if (!grouped[rule.rule_category]) {
        grouped[rule.rule_category] = [];
      }
      grouped[rule.rule_category].push(rule);
    });
    return grouped;
  };

  const rulesByCategory = groupRulesByCategory();

  if (loading) {
    return <div className="loading">ルール・マナーを確認中...</div>;
  }

  return (
    <div className="rules-confirmation">
      <h3>🎯 旅を開始する前に</h3>
      <p className="rules-intro">
        選択されたメイン目的に関連するルール・マナー・注意事項を確認し、
        チェックボックスにチェックを入れてください。
      </p>

      {/* 全般的なルール */}
      {rulesByCategory.general && (
        <div className="rules-category">
          <h4>📋 基本的なルール・マナー</h4>
          <div className="rules-list">
            {rulesByCategory.general.map(rule => (
              <div key={rule.id} className="rule-item">
                <label className="rule-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmations[rule.id] || false}
                    onChange={() => toggleConfirmation(rule.id)}
                  />
                  <div className="rule-content">
                    <div className="rule-title">
                      {rule.rule_title}
                      {rule.is_required && <span className="required-badge">必須</span>}
                    </div>
                    <div className="rule-description">
                      {rule.rule_description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 特定のルール */}
      {rulesByCategory.specific && (
        <div className="rules-category">
          <h4>⚠️ 特定の活動に関する注意事項</h4>
          <div className="rules-list">
            {rulesByCategory.specific.map(rule => (
              <div key={rule.id} className="rule-item">
                <label className="rule-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmations[rule.id] || false}
                    onChange={() => toggleConfirmation(rule.id)}
                  />
                  <div className="rule-content">
                    <div className="rule-title">
                      {rule.rule_title}
                      {rule.is_required && <span className="required-badge">必須</span>}
                    </div>
                    <div className="rule-description">
                      {rule.rule_description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 確認完了ボタン */}
      <div className="rules-actions">
        <button
          className={`btn-primary ${!allConfirmed ? 'disabled' : ''}`}
          onClick={() => allConfirmed && onConfirmComplete()}
          disabled={!allConfirmed}
        >
          {allConfirmed ? '✅ 旅を開始する' : '❌ 必須項目を確認してください'}
        </button>
        
        {!allConfirmed && rules.filter(r => r.is_required).length > 0 && (
          <p className="confirmation-note">
            必須項目（{rules.filter(r => r.is_required && !confirmations[r.id]).length}件未確認）
            をすべて確認してから旅を開始できます。
          </p>
        )}
      </div>
    </div>
  );
};

export default RulesConfirmation;