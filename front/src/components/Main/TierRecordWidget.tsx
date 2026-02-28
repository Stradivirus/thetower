/**
 * 파일명: thetower/front/src/components/Main/TierRecordWidget.tsx
 * 용도: 티어별 서버 최고 기록과 개인 기록을 비교 표시하는 사이드 위젯
 * 기능: 실시간 기록 페칭, 위젯 가시성 및 티어 범위 설정 저장(Local Storage), 클릭 시 티어별 히스토리 이동
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGlobalMaxWaves, type TierRecord } from '../../api/stats';
import { ChevronDown, ChevronUp, Settings, X, Trophy, Info, ExternalLink } from 'lucide-react'; 
import { T } from '../../locales'; 

// 로컬 스토리지 키 상수 정의
const STORAGE_KEY_VISIBLE = 'tier_widget_visible';
const STORAGE_KEY_MIN_TIER = 'tier_widget_min_tier';
const STORAGE_KEY_MAX_TIER = 'tier_widget_max_tier';

const TierRecordWidget: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TierRecord[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [minTier, setMinTier] = useState(1);
  const [maxTier, setMaxTier] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  
  const Text = T.main.WIDGET; 
  const token = localStorage.getItem('access_token');

  // 데이터 및 사용자 설정 로드
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const data = await getGlobalMaxWaves();
        if (Array.isArray(data)) {
          setRecords(data);
        } else {
          setRecords([]); 
        }
      } catch (error) {
        console.error("기록을 불러오는데 실패했습니다:", error);
        setRecords([]);
      }
    };
    loadData();

    // 저장된 설정 불러오기
    const savedVisible = localStorage.getItem(STORAGE_KEY_VISIBLE);
    const savedMinTier = localStorage.getItem(STORAGE_KEY_MIN_TIER);
    const savedMaxTier = localStorage.getItem(STORAGE_KEY_MAX_TIER);
    
    if (savedVisible !== null) setIsVisible(savedVisible === 'true');
    if (savedMinTier !== null) setMinTier(parseInt(savedMinTier, 10));
    if (savedMaxTier !== null) setMaxTier(parseInt(savedMaxTier, 10));
  }, [token]);

  /** 위젯 표시 여부 토글 */
  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem(STORAGE_KEY_VISIBLE, String(newState));
  };

  /** 최소 표시 티어 변경 핸들러 */
  const handleMinTierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 1;
    setMinTier(val);
    localStorage.setItem(STORAGE_KEY_MIN_TIER, String(val));
  };

  /** 최대 표시 티어 변경 핸들러 */
  const handleMaxTierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 20;
    setMaxTier(val);
    localStorage.setItem(STORAGE_KEY_MAX_TIER, String(val));
  };

  if (!token) return null;

  // 위젯이 숨겨진 상태일 때의 플로팅 버튼 뷰
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-yellow-400 shadow-lg transition-transform hover:scale-110 hover:bg-gray-700 active:scale-95 border border-gray-600 hover:border-yellow-400 bottom-6 md:bottom-24"
        title={Text.TOGGLE_ON}
      >
        <Trophy size={28} />
      </button>
    );
  }

  const safeRecords = Array.isArray(records) ? records : [];
  const filteredRecords = safeRecords.filter(r => r.tier >= minTier && r.tier <= maxTier);

  return (
    <div className="fixed right-6 top-24 w-64 z-40 flex flex-col gap-2">
      {/* Lab Link */}
      <a 
        href="https://td-lab.pages.dev" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400 transition-all group"
      >
        <span className="text-sm font-bold tracking-tight">{Text.LAB_LINK}</span>
        <ExternalLink size={16} className="opacity-50 group-hover:opacity-100 transition-all" />
      </a>

      {/* 메인 위젯 */}
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden transition-all">
        {/* 위젯 헤더 */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold">{Text.TITLE}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="p-1 hover:bg-gray-700 rounded text-gray-400"
            title={Text.SETTINGS}
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1 hover:bg-gray-700 rounded text-gray-400"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button 
            onClick={toggleVisibility} 
            className="p-1 hover:bg-gray-700 rounded text-gray-400"
            title={Text.TOGGLE_OFF}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 티어 범위 설정 패널 */}
      {showSettings && isExpanded && (
        <div className="p-3 bg-gray-800 border-b border-gray-700 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-gray-300">{Text.MIN_TIER}</label>
            <input 
              type="number" 
              min="1" 
              max="30" 
              value={minTier} 
              onChange={handleMinTierChange}
              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-300">{Text.MAX_TIER}</label>
            <input 
              type="number" 
              min="1" 
              max="30" 
              value={maxTier} 
              onChange={handleMaxTierChange}
              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* 기록 테이블 (확장 시 노출) */}
      {isExpanded && (
        <div className="p-2">
          {filteredRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-sm">{Text.NO_RECORD}</div>
          ) : (
            <>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="pb-2 text-left pl-2 w-1/4">{Text.COL_TIER}</th>
                    <th className="pb-2 text-right w-1/3">{Text.COL_MY}</th>
                    <th className="pb-2 text-right pr-2 w-1/3">{Text.COL_MAX}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.tier} 
                      className="hover:bg-slate-800/80 transition-all cursor-pointer group active:scale-[0.98]"
                      onClick={() => navigate(`/history?tier=${record.tier}`)}
                    >
                      <td className="py-2 pl-2 text-gray-300 group-hover:text-yellow-400 font-bold transition-colors">T{record.tier}</td>
                      <td className="py-2 text-right font-mono font-bold text-green-400">
                        {record.my_wave > 0 ? record.my_wave.toLocaleString() : '-'}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono font-bold text-blue-400">
                        {record.max_wave.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-3 pt-2 border-t border-gray-800/50 flex items-center justify-center gap-1.5">
                <Info size={10} className="text-slate-500" />
                <span className="text-[12px] text-slate-500 font-medium">
                  {Text.CLICK_INFO}
                </span>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default TierRecordWidget;