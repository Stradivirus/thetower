/**
 * 파일명: thetower/front/src/pages/ReportDetailV2.tsx
 * 용도: V2 전용 전투 기록 상세 분석 페이지 (향상된 대시보드 및 시각화 포함)
 */
import { ArrowLeft, Activity, Skull, Clock, FileText, Trash2, AlertTriangle, Trophy, Coins, Wallet, Shield } from 'lucide-react';
import type { FullReportV2 } from '../types/report';
import { formatDate, formatNumber } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import HighlightDashboard from '../components/Detail/HighlightDashboard';
import StatGrid from '../components/Detail/StatGrid';
import { T } from '../locales'; 
import { ENEMY_LEFT_ORDER, ENEMY_RIGHT_ORDER, V2_CURRENCY_KEYS } from '../constants/reportRules';

interface Props {
  data: FullReportV2;
  onBack: () => void;
  onDelete: (e: React.MouseEvent) => void;
  deletePopup: { isOpen: boolean; x: number; y: number };
  onClosePopup: () => void;
  handleConfirmDelete: () => void;
}

export default function ReportDetailV2({ data, onBack, onDelete, deletePopup, onClosePopup, handleConfirmDelete }: Props) {
  const { main, v2_main, v2_detail, detail } = data;
  const Text = T.detail;
  const Common = T.common;

  const closePopup = onClosePopup;

  const getRecordData = () => {
    if (!v2_main) return null;
    const records: Record<string, string> = {};
    records[Text.REC_BEST_CPM] = formatNumber(v2_main.best_coins_per_minute || 0);
    records[Text.REC_MAX_WAVE_SKIP] = String(v2_main.max_wave_skip || 0);
    records[Text.REC_SKIP_COINS] = formatNumber(v2_main.best_skip_coins || 0);
    records[Text.REC_SKIP_CELLS] = formatNumber(v2_main.best_skip_cells || 0);
    records[Text.REC_MAX_SM_STACK] = String(v2_main.max_smart_missile_stack || 0);
    records[Text.REC_MAX_GOLDEN_COMBO] = String(v2_main.max_golden_combo || 0);
    records[Text.REC_GOLDEN_COMBO_COINS] = formatNumber(v2_main.best_golden_combo_coins || 0);
    records[Text.REC_MAX_ILM_CHARGE] = String(v2_main.max_inner_mine_charge || 0);
    return records;
  };

  const recordsData = getRecordData();

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center flex-wrap gap-x-6 gap-y-1">
            <h1 className="text-xl font-bold text-white">{formatDate(main.battle_date)}</h1>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-black px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded shadow-inner">
                T{main.tier}
              </span>
              
              <div className="flex items-center gap-4 text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-sm">
                  <Clock size={16} className="text-slate-500" />
                  <span className="text-slate-200 font-bold">{main.real_time}</span>
                </span>
                
                <span className="w-px h-3 bg-slate-800" />
                
                <span className="text-sm">
                  <span className="text-slate-500 font-bold mr-1.5">{Text.WAVE}</span>
                  <span className="text-white font-black text-base tracking-tight">{main.wave}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {main.notes && (
            <div className="hidden md:block max-w-md">
               <div className="flex items-start gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl text-base text-slate-300">
                  <FileText size={18} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="whitespace-pre-wrap leading-tight">{main.notes}</p>
               </div>
            </div>
          )}
          <button onClick={onDelete} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-lg group">
            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <HighlightDashboard main={main} v2_main={v2_main} />
        
        <div className="w-full">
            <CombatAnalysis 
                combatJson={detail?.combat_json} 
                damageJsonV2={v2_detail?.damage_json} 
                enemyJson={v2_detail?.enemy_json}
                killEffects={v2_detail?.stats_json?.kill_effects}
                killSourceJson={v2_detail?.kill_source_json}
                totalEnemies={main.total_enemies}
            />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-6">
            <StatGrid title={Text.SECTION_RECORDS} icon={Trophy} color="text-yellow-500" data={recordsData || {}} defaultOpen={false} />
            <StatGrid title={Text.SECTION_UTILITY} icon={Activity} color="text-blue-500" data={v2_detail?.utility_json || {}} defaultOpen={false} />
            <StatGrid title={Text.HEADER_DEFENSE} icon={Shield} color="text-blue-400" data={v2_detail?.damage_json || {}} v2Sections={['damage_taken', 'bonus_hp', 'hp_regen', 'damage_block']} defaultOpen={false} />
          </div>
          <div className="space-y-6">
            <StatGrid 
                title={Text.SECTION_ENEMY} 
                icon={Skull} 
                color="text-orange-500" 
                data={{ 
                        ...v2_detail?.enemy_json, 
                        ...(v2_detail?.stats_json?.stats || {}),
                        ...(v2_detail?.stats_json?.enemy_hits || {}),
                        ...(v2_detail?.stats_json?.kill_effects || {})
                      }} 
                order={[...ENEMY_LEFT_ORDER, ...ENEMY_RIGHT_ORDER]}
                defaultOpen={false} 
            />
          </div>
          <div className="space-y-6">
            <StatGrid title={Text.SECTION_COIN} icon={Coins} color="text-amber-500" data={v2_detail?.coin_json || {}} />
            <StatGrid title={Text.SECTION_CURRENCY} icon={Wallet} color="text-emerald-500" data={v2_detail?.currency_json || {}} order={V2_CURRENCY_KEYS} />
          </div>
        </div>
      </div>

      {deletePopup.isOpen && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-64 animate-fade-in"
          style={{ top: deletePopup.y, left: Math.min(deletePopup.x - 200, window.innerWidth - 270) }}
        >
          <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold">
            <AlertTriangle size={18} />
            <span>{Text.DELETE_TITLE}</span>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">{Text.DELETE_DESC}</p>
          <div className="flex justify-end gap-2">
            <button onClick={closePopup} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg">{Common.CANCEL}</button>
            <button onClick={handleConfirmDelete} className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg">{Text.DELETE_CONFIRM}</button>
          </div>
        </div>
      )}
    </div>
  );
}
