import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { localizeTravelRules } from '../utils/i18nDataHelper';

const RulesConfirmation = ({ tripId, mainPurposeIds, onConfirmComplete }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [confirmations, setConfirmations] = useState({});
  const [allConfirmed, setAllConfirmed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

  useEffect(() => {
    console.log('RulesConfirmation mounted:', { tripId, mainPurposeIds });
    if (tripId && mainPurposeIds && mainPurposeIds.length > 0) {
      fetchRules();
      // 10秒のタイムアウトを設定
      const timeout = setTimeout(() => {
        console.log('Timeout triggered, loading state:', loading);
        setTimeoutError(true);
        setLoading(false);
      }, 10000);
      return () => clearTimeout(timeout);
    } else {
      // tripIdまたはmainPurposeIdsがない場合は即座にローディング解除
      console.log('No tripId or mainPurposeIds, skipping fetch');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, mainPurposeIds, i18n.language]);

  useEffect(() => {
    checkAllConfirmed();
  }, [confirmations, rules]);

  // 該当するルール・マナーを取得
  const fetchRules = async () => {
    console.log('fetchRules called with mainPurposeIds:', mainPurposeIds);
    try {
      setLoading(true);
      
      console.log('Fetching travel_rules from Supabase...');
      const { data, error } = await supabase
        .from('travel_rules')
        .select('*')
        .in('main_purpose_id', mainPurposeIds)
        .order('rule_category', { ascending: true })
        .order('display_order', { ascending: true });
      
      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('travel_rules取得エラー:', error);
        setHasError(true);
        setLoading(false);
        return;
      }

      // デバッグ用ログ（本番では削除）
      if (window.location.hostname === 'localhost') {
        console.log('RulesConfirmation - mainPurposeIds:', mainPurposeIds);
        console.log('RulesConfirmation - fetched rules:', data);
      }

      // 言語対応: ヘルパー関数を使用してdisplayTitle, displayDescriptionを追加
      const localizedRules = localizeTravelRules(data || [], i18n.language);

      // 重複を排除（rule_titleとrule_descriptionが同じものを除外）
      // ただし、最初に見つかったルールのIDを保持する
      const uniqueRules = [];
      const seen = new Map();

      localizedRules.forEach(rule => {
        const displayTitle = rule.displayTitle || rule.rule_title;
        const displayDescription = rule.displayDescription || rule.rule_description;
        const key = `${displayTitle}_${displayDescription}`;
        if (!seen.has(key)) {
          seen.set(key, rule.id);
          uniqueRules.push(rule);
        }
      });

      if (window.location.hostname === 'localhost') {
        console.log('RulesConfirmation - unique rules:', uniqueRules);
      }
      setRules(uniqueRules);

      // 既存の確認状況を取得
      const { data: existingConfirmations, error: confirmError } = await supabase
        .from('trip_rule_confirmations')
        .select('rule_id, is_confirmed')
        .eq('trip_id', tripId);

      if (confirmError) {
        console.error('trip_rule_confirmations取得エラー:', confirmError);
        // エラーがあってもルール表示は続行
        setConfirmations({});
      }

      // 既存確認状況をセット
      const confirmationMap = {};
      existingConfirmations?.forEach(conf => {
        confirmationMap[conf.rule_id] = conf.is_confirmed;
      });
      
      setConfirmations(confirmationMap);

    } catch (error) {
      console.error('ルール取得エラー:', error);
      setHasError(true);
      setRules([]);
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

  if (loading && !timeoutError) {
    return <div className="loading">{t('rules.loading')}</div>;
  }

  // タイムアウトエラーの場合
  if (timeoutError) {
    return (
      <div className="rules-confirmation">
        <h3>{t('rules.timeout')}</h3>
        <p className="rules-intro">
          {t('rules.timeoutMessage')}
        </p>
        <div className="rules-actions">
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            {t('rules.reload')}
          </button>
          <button
            className="btn-primary"
            onClick={onConfirmComplete}
          >
            {t('rules.skipAndStart')}
          </button>
        </div>
      </div>
    );
  }

  // エラーまたはルールが0件の場合
  if (hasError || rules.length === 0) {
    return (
      <div className="rules-confirmation">
        <h3>🎯 {t('rules.beforeTrip')}</h3>
        <p className="rules-intro">
          {t('rules.noRules')}
        </p>
        <div className="rules-actions">
          <button
            className="btn-primary"
            onClick={onConfirmComplete}
          >
            {t('rules.startTrip')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rules-confirmation">
      <h3>🎯 {t('rules.beforeTrip')}</h3>
      <p className="rules-intro">
        {t('rules.intro')}
      </p>

      {/* 全般的なルール */}
      {rulesByCategory.general && (
        <div className="rules-category">
          <h4>📋 {t('rules.basicRules')}</h4>
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
                      {rule.displayTitle || rule.rule_title}
                      {rule.is_required && <span className="required-badge">{t('rules.requiredBadge')}</span>}
                    </div>
                    <div className="rule-description">
                      {rule.displayDescription || rule.rule_description}
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
          <h4>⚠️ {t('rules.specificRules')}</h4>
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
                      {rule.displayTitle || rule.rule_title}
                      {rule.is_required && <span className="required-badge">{t('rules.requiredBadge')}</span>}
                    </div>
                    <div className="rule-description">
                      {rule.displayDescription || rule.rule_description}
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
          {allConfirmed ? t('rules.startTrip') : t('rules.checkRequired')}
        </button>

        {!allConfirmed && rules.filter(r => r.is_required).length > 0 && (
          <p className="confirmation-note">
            {t('rules.requiredItemsNote', { count: rules.filter(r => r.is_required && !confirmations[r.id]).length })}
          </p>
        )}
      </div>
    </div>
  );
};

export default RulesConfirmation;