/**
 * 파일명: thetower/front/src/pages/V1/ReportDetailV1.tsx
 * 용도: V1 전용 전투 기록 상세 분석 페이지
 */
import { ArrowLeft, Activity, Skull, Shield, Clock, FileText, Trash2, AlertTriangle } from 'lucide-react';
import type { FullReportV2 } from '../../types/report';
import { formatDate } from '../../utils/format';
import CombatAnalysisV1 from '../../components/Detail/V1/CombatAnalysisV1';
import StatGridV1 from '../../components/Detail/V1/StatGridV1';
import { T } from '../../locales'; 

interface Props {
  data: FullReportV2;
  onBack: () => void;
  onDelete: (e: React.MouseEvent) => void;
  deletePopup: { isOpen: boolean; x: number; y: number };
  setDeletePopup: (val: any) => void;
  handleConfirmDelete: () => void;
}

export default function ReportDetailV1({ data, onBack, onDelete, deletePopup, setDeletePopup, handleConfirmDelete }: Props) {
  const { main, detail } = data;
  const Text = T.detail;
  const Common = T.common;

  const closePopup = () => setDeletePopup((prev: any) => ({ ...prev, isOpen: false }));

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 상단 헤더 */}
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
          {main.notes && (
            <div className="hidden md:flex flex-col items-end max-w-md">
               <div className="flex items-start gap-2 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-sm text-slate-300 shadow-sm">
                  <FileText size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="whitespace-pre-wrap leading-relaxed">{main.notes}</p>
               </div>
            </div>
          )}
          <button onClick={onDelete} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-500 transition-all shadow-sm">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 전투 분석 */}
        <div className="w-full">
            <CombatAnalysisV1 combatJson={detail?.combat_json} />
        </div>
        
        {/* 상세 스탯 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <StatGridV1 title={Text.SECTION_UTILITY} icon={Activity} color="text-blue-500" data={detail?.utility_json || {}} defaultOpen={false} />
          <StatGridV1 title={Text.SECTION_ENEMY} icon={Skull} color="text-orange-500" data={detail?.enemy_json || {}} defaultOpen={false} />
          <StatGridV1 title={Text.SECTION_BOT} icon={Shield} color="text-purple-500" data={detail?.bot_json || {}} defaultOpen={false} />
        </div>
      </div>

      {/* 삭제 확인 팝업 */}
      {deletePopup.isOpen && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-64 animate-fade-in"
          style={{ top: deletePopup.y, left: Math.min(deletePopup.x - 200, window.innerWidth - 270) }}
        >
          <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold">
            <AlertTriangle size={18} />
            <span>{Text.DELETE_TITLE}</span>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            {Text.DELETE_DESC}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={closePopup} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg">
              {Common.CANCEL}
            </button>
            <button onClick={handleConfirmDelete} className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg">
              {Text.DELETE_CONFIRM}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
