/**
 * 파일명: thetower/front/src/pages/ReportDetailV2.tsx
 * 용도: V2 전용 전투 기록 상세 분석 페이지
 * 특징: 
 *   - V1보다 세분화된 데이터(v2_main, v2_detail)를 시각화
 *   - 하이라이트 대시보드, 대미지 분석 차트, 자원 및 적군 통계 그리드 포함
 *   - 반응형 레이아웃 (데스크탑 3열 그리드 / 모바일 1열 스택)
 */
import { ArrowLeft, Activity, Clock, FileText, Trash2, AlertTriangle } from 'lucide-react';
import type { FullReportV2 } from '../types/report';
import { formatDate, formatNumber } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import HighlightDashboard from '../components/Detail/HighlightDashboard';
import UtilityGrid from '../components/Detail/grid/UtilityGrid';
import ResourceGrid from '../components/Detail/grid/ResourceGrid';
import EnemyGrid from '../components/Detail/grid/EnemyGrid';
import { T } from '../locales'; 

interface Props {
  data: FullReportV2;                // API로부터 받아온 V2 통합 리포트 데이터
  onBack: () => void;                 // 뒤로 가기 액션 핸들러
  onDelete: (e: React.MouseEvent) => void; // 삭제 팝업 트리거
  deletePopup: { isOpen: boolean; x: number; y: number }; // 삭제 팝업 상태 (부모 제어)
  onClosePopup: () => void;           // 삭제 팝업 닫기
  handleConfirmDelete: () => void;    // 최종 삭제 확인 핸들러
}

export default function ReportDetailV2({ data, onBack, onDelete, deletePopup, onClosePopup, handleConfirmDelete }: Props) {
  const { main, v2_main, v2_detail, detail } = data;
  const Text = T.detail;
  const Common = T.common;

  const closePopup = onClosePopup;

  /** 
   * V2 기록 섹션 데이터 가공
   * - v2_main에 포함된 각종 최고 기록(CPM, 스킵 등)을 화면에 표시할 라벨-값 매핑으로 변환
   */
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
      {/* 
        [1] 상단 플로팅 헤더 
        - 날짜, 티어, 리얼타임, 웨이브 정보 표시
        - 삭제 버튼 및 작성된 메모 요약 포함
      */}
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
        {/* [2] 핵심 지표 대시보드 (코인, 셀, 리롤, 킬러 정보) */}
        <HighlightDashboard main={main} v2_main={v2_main} />
        
        {/* [3] 전투 상세 분석 (대미지 딜러, 처치 수단, 방어 통계 등) */}
        <div className="w-full">
            <CombatAnalysis 
                combatJson={detail?.combat_json} 
                damageJsonV2={v2_detail?.damage_json} 
                enemyJson={v2_detail?.enemy_json}
                killEffects={v2_detail?.stats_json?.kill_effects}
                killSourceJson={v2_detail?.kill_source_json}
                totalEnemies={main.total_enemies}
                stats={v2_detail?.stats_json?.stats}
            />
        </div>
        
        {/* [4] 상세 통계 그리드 영역 (기록/유틸, 적군, 자원) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 기록 및 유틸리티 (V2 기록 데이터 병합하여 전달) */}
          <div className="space-y-6">
            <UtilityGrid 
              title="RECORDS & UTILITY" 
              icon={Activity} 
              color="text-blue-500" 
              data={{
                ...(v2_detail?.utility_json || {}),
                _records: recordsData || {}
              }} 
              defaultOpen={false} 
            />
          </div>
          
          {/* 적군 분석 통계 (타격 수, 처치 효과, 출현 수 병합) */}
          <div className="space-y-6">
            <EnemyGrid 
                data={{ 
                        ...v2_detail?.enemy_json, 
                        ...(v2_detail?.stats_json?.stats || {}),
                        ...(v2_detail?.stats_json?.enemy_hits || {}),
                        ...(v2_detail?.stats_json?.kill_effects || {})
                      }} 
                defaultOpen={false} 
            />
          </div>
          
          {/* 자원 및 화폐 획득 통계 */}
          <div className="space-y-6">
            <ResourceGrid 
                coinData={v2_detail?.coin_json} 
                currencyData={v2_detail?.currency_json} 
            />
          </div>
        </div>
      </div>

      {/* [5] 삭제 확인 팝업 (Overlay) */}
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
