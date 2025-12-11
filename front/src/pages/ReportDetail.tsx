import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Skull, Shield, Clock, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { getFullReport, deleteReport } from '../api/reports';
import type { FullReport } from '../types/report';
import { formatDate } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import StatGrid from '../components/Detail/StatGrid';

interface Props {
  battleDate: string;
  onBack: () => void;
}

export default function ReportDetailPage({ battleDate, onBack }: Props) {
  const [data, setData] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);

  // [New] 삭제 팝업 상태 (표시 여부 + 마우스 좌표)
  const [deletePopup, setDeletePopup] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });

  useEffect(() => {
    getFullReport(battleDate).then(setData).finally(() => setLoading(false));
  }, [battleDate]);

  // [New] 삭제 버튼 클릭 핸들러 (좌표 저장)
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 마우스 위치 기준으로 팝업 표시
    setDeletePopup({
      isOpen: true,
      x: e.clientX,
      y: e.clientY + 20 // 버튼 살짝 아래
    });
  };

  // [New] 실제 삭제 실행
  const handleConfirmDelete = async () => {
    try {
      await deleteReport(battleDate);
      // alert("기록이 삭제되었습니다."); <-- 이 줄을 삭제하여 팝업 제거
      onBack(); // 즉시 목록으로 돌아가기
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletePopup(prev => ({ ...prev, isOpen: false }));
    }
  };

  // [New] 팝업 닫기
  const closePopup = () => setDeletePopup(prev => ({ ...prev, isOpen: false }));

  if (loading) return <div className="text-center text-slate-400 py-20">로딩 중...</div>;
  if (!data) return null;

  const { main, detail } = data;

  return (
    // 화면 전체 클릭 시 팝업 닫기 이벤트 추가
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4" onClick={closePopup}>
      {/* === 헤더 === */}
      <div className="flex items-start justify-between mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        
        {/* 왼쪽: 뒤로가기 + 날짜/티어 정보 */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {formatDate(main.battle_date)}
              <span className="text-sm font-normal px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                Tier {main.tier}
              </span>
            </h1>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
               <span className="flex items-center gap-1"><Clock size={14}/> {main.real_time}</span>
               <span>•</span>
               <span>Wave {main.wave}</span>
            </div>
          </div>
        </div>

        {/* 오른쪽: 메모 + 삭제 버튼 영역 */}
        <div className="flex items-start gap-3">
          {main.notes && (
            <div className="hidden md:flex flex-col items-end max-w-md">
               <div className="flex items-start gap-2 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-sm text-slate-300 shadow-sm">
                  <FileText size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="whitespace-pre-wrap leading-relaxed">{main.notes}</p>
               </div>
            </div>
          )}
          
          {/* [New] 삭제 버튼 추가 */}
          <button 
            onClick={handleDeleteClick}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm group"
            title="기록 삭제"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. 전투 통계 */}
        <div className="w-full">
            <CombatAnalysis combatJson={detail.combat_json} />
        </div>

        {/* 2. 하단 상세 데이터 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <StatGrid title="유틸리티" icon={Activity} color="text-blue-500" data={detail.utility_json} defaultOpen={false} />
          <StatGrid title="적 통계" icon={Skull} color="text-orange-500" data={detail.enemy_json} defaultOpen={false} />
          <StatGrid title="봇 & 가디언" icon={Shield} color="text-purple-500" data={detail.bot_json} defaultOpen={false} />
        </div>
      </div>

      {/* [New] 마우스 위치 팝업 (Fixed Position) */}
      {deletePopup.isOpen && (
        <div 
          className="fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-64 animate-fade-in"
          style={{ 
            top: deletePopup.y, 
            left: Math.min(deletePopup.x - 200, window.innerWidth - 270) // 화면 오른쪽 잘림 방지
          }}
          onClick={(e) => e.stopPropagation()} // 팝업 내부 클릭 시 닫히지 않음
        >
          <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold">
            <AlertTriangle size={18} />
            <span>기록 삭제</span>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            정말 이 기록을 삭제하시겠습니까?<br/>
            <span className="text-xs text-slate-500">(삭제 후 기록 재업로드로 복구 가능)</span>
          </p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={closePopup}
              className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              취소
            </button>
            <button 
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/20"
            >
              삭제 확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}