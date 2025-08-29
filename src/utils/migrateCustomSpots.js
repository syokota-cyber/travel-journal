// カスタムスポットID統一化のためのマイグレーションユーティリティ
import { supabase } from '../lib/supabase';

/**
 * 既存のカスタムスポットIDを統一形式（custom_name_XXX）に変換
 */
export const migrateCustomSpotIds = async () => {
  console.log('🔄 Starting custom spot ID migration...');
  
  try {
    // 1. trip_reviewsテーブルから既存のカスタムスポットデータを取得
    const { data: reviewData, error: reviewError } = await supabase
      .from('trip_reviews')
      .select('*');
    
    if (reviewError) throw reviewError;
    
    console.log('📊 Found review records:', reviewData?.length || 0);
    
    for (const review of reviewData || []) {
      let hasChanges = false;
      const updatedAchievedSub = [];
      
      // achieved_sub_purposesの各IDをチェック
      if (review.achieved_sub_purposes && Array.isArray(review.achieved_sub_purposes)) {
        for (const subId of review.achieved_sub_purposes) {
          const idStr = String(subId);
          
          // Legacy形式のカスタムIDを検出
          if (idStr.includes('custom_sub_') || idStr.includes('custom_') && idStr.includes('_')) {
            console.log('🔍 Legacy custom ID detected:', idStr);
            
            // trip_purposesテーブルから対応する名前を取得
            const { data: purposeData } = await supabase
              .from('trip_purposes')
              .select('custom_purpose')
              .eq('trip_id', review.trip_id)
              .eq('purpose_type', 'custom')
              .not('custom_purpose', 'is', null);
            
            if (purposeData && purposeData.length > 0) {
              // 最初に見つかったカスタム目的を使用（より精密な照合は後で実装）
              const customName = purposeData[0].custom_purpose;
              const newId = `custom_name_${customName}`;
              console.log(`  → Converting to: ${newId}`);
              updatedAchievedSub.push(newId);
              hasChanges = true;
            } else {
              // 対応する名前が見つからない場合は元IDを保持
              updatedAchievedSub.push(idStr);
            }
          } else {
            // 通常のIDはそのまま保持
            updatedAchievedSub.push(idStr);
          }
        }
      }
      
      // 変更がある場合はデータベースを更新
      if (hasChanges) {
        console.log(`📝 Updating review for trip ${review.trip_id}`);
        console.log('  Old IDs:', review.achieved_sub_purposes);
        console.log('  New IDs:', updatedAchievedSub);
        
        const { error: updateError } = await supabase
          .from('trip_reviews')
          .update({ achieved_sub_purposes: updatedAchievedSub })
          .eq('trip_id', review.trip_id);
        
        if (updateError) {
          console.error('❌ Failed to update review:', updateError);
        } else {
          console.log('✅ Successfully updated review');
        }
      }
    }
    
    console.log('✅ Custom spot ID migration completed');
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 開発者ツール用：手動でマイグレーションを実行
 */
window.migrateCustomSpots = migrateCustomSpotIds;