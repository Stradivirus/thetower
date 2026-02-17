/**
 * 파일명: thetower/front/src/pages/ReportDetail.tsx
 * 용도: 개별 전투 기록의 상세 분석 정보 표시 페이지
 * 기능: 전투 요약 정보, 상세 통계(Utility, Enemy, Bot), 리팩토링된 전투 분석 차트 제공 및 기록 삭제 기능
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Skull, Shield, Clock, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { getFullReport, deleteReport } from '../api/reports';
import type { FullReport } from '../types/report';
import { formatDate } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import StatGrid from '../components/Detail/StatGrid';
import { T } from '../locales'; 

interface Props {
  battleDate: string; // 조회할 리포트의 날짜 ID
  onBack: () => void;  // 뒤로 가기 핸들러
}

export default function ReportDetailPage({ battleDate, onBack }: Props) {
  const [data, setData] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 삭제 확인 팝업 상태 (위치 및 오픈 여부)
  const [deletePopup, setDeletePopup] = useState<{isOpen: boolean; x: number; y: number;}>({ isOpen: false, x: 0, y: 0 });

  const Text = T.detail; 
  const Common = T.common; 

  // 초기 데이터 로드: 상세 리포트 정보 페칭
  useEffect(() => {
    getFullReport(battleDate).then(setData).finally(() => setLoading(false));
  }, [battleDate]);

  /** 삭제 버튼 클릭 시 확인 팝업 표시 */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletePopup({ isOpen: true, x: e.clientX, y: e.clientY + 20 });
  };

  /** 실제 삭제 수행 */
  const handleConfirmDelete = async () => {
    try {
      await deleteReport(battleDate);
      onBack();
    } catch (err) {
      console.error(err);
      alert(Text.ERR_DELETE);
    } finally {
      setDeletePopup(prev => ({ ...prev, isOpen: false }));
    }
  };

  /** 팝업 닫기 */
  const closePopup = () => setDeletePopup(prev => ({ ...prev, isOpen: false }));

  if (loading) return <div className="text-center text-slate-400 py-20">{Common.LOADING}</div>;
  if (!data) return null;

  const { main, detail } = data;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4" onClick={closePopup}>
      {/* 상단 헤더: 요약 정보 및 제어 버튼 */}
      <div className="flex items-start justify-between mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {formatDate(main.battle_date)}
              <span className="text-sm font-normal px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                {Text.TIER} {main.tier}
              </span>
            </h1>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
               <span className="flex items-center gap-1"><Clock size={14}/> {main.real_time}</span>
               <span>•</span>
               <span>{Text.WAVE} {main.wave}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {/* 메모 표시 (모바일에서는 숨김) */}
          {main.notes && (
            <div className="hidden md:flex flex-col items-end max-w-md">
               <div className="flex items-start gap-2 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-sm text-slate-300 shadow-sm">
                  <FileText size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="whitespace-pre-wrap leading-relaxed">{main.notes}</p>
               </div>
            </div>
          )}
          
          {/* 삭제 버튼 */}
          <button onClick={handleDeleteClick} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm group" title={Text.DELETE_TITLE}>
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 중앙: 대미지 및 전투 분석 차트 */}
        <div className="w-full">
            <CombatAnalysis combatJson={detail.combat_json} />
        </div>
        
        {/* 하단: 유틸리티, 적, 봇 상세 스탯 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <StatGrid title={Text.SECTION_UTILITY} icon={Activity} color="text-blue-500" data={detail.utility_json} defaultOpen={false} />
          <StatGrid title={Text.SECTION_ENEMY} icon={Skull} color="text-orange-500" data={detail.enemy_json} defaultOpen={false} />
          <StatGrid title={Text.SECTION_BOT} icon={Shield} color="text-purple-500" data={detail.bot_json} defaultOpen={false} />
        </div>
      </div>

      {/* 삭제 확인 플로팅 팝업 */}
      {deletePopup.isOpen && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-64 animate-fade-in"
          style={{ top: deletePopup.y, left: Math.min(deletePopup.x - 200, window.innerWidth - 270) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold">
            <AlertTriangle size={18} />
            <span>{Text.DELETE_TITLE}</span>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            {Text.DELETE_DESC}<br/>
            <span className="text-xs text-slate-500">{Text.DELETE_SUB}</span>
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={closePopup} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              {Common.CANCEL}
            </button>
            <button onClick={handleConfirmDelete} className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/20">
              {Text.DELETE_CONFIRM}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}