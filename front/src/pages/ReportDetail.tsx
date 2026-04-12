/**
 * 파일명: thetower/front/src/pages/ReportDetail.tsx
 * 용도: 개별 전투 기록의 상세 분석 정보 표시 페이지 (Switcher)
 * 기능: 데이터의 버전에 따라 V1 또는 V2 상세 페이지를 렌더링
 */
import { useState, useEffect } from 'react';
import { getFullReport, deleteReport } from '../api/reports';
import type { FullReportV2 } from '../types/report';
import { T } from '../locales'; 
import ReportDetailV1 from './V1/ReportDetailV1';
import ReportDetailV2 from './ReportDetailV2';

interface Props {
  battleDate: string; // 조회할 리포트의 날짜 ID
  onBack: () => void;  // 뒤로 가기 핸들러
}

export default function ReportDetailPage({ battleDate, onBack }: Props) {
  const [data, setData] = useState<FullReportV2 | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 삭제 확인 팝업 상태 (V1, V2 공통 사용을 위해 부모에서 관리)
  const [deletePopup, setDeletePopup] = useState<{isOpen: boolean; x: number; y: number;}>({ isOpen: false, x: 0, y: 0 });

  const Text = T.detail; 
  const Common = T.common; 

  // 초기 데이터 로드
  useEffect(() => {
    getFullReport(battleDate)
      .then(setData)
      .finally(() => setLoading(false));
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

  if (loading) return <div className="text-center text-slate-400 py-20">{Common.LOADING}</div>;
  if (!data) return null;

  // V2 데이터 존재 여부에 따라 분기 처리
  const handleClosePopup = () => setDeletePopup(prev => ({ ...prev, isOpen: false }));

  if (data.v2_main) {
    return (
      <ReportDetailV2
        data={data}
        onBack={onBack}
        onDelete={handleDeleteClick}
        deletePopup={deletePopup}
        onClosePopup={handleClosePopup}
        handleConfirmDelete={handleConfirmDelete}
      />
    );
  }

  // 기본적으로 V1 페이지 렌더링
  return (
    <ReportDetailV1
      data={data}
      onBack={onBack}
      onDelete={handleDeleteClick}
      deletePopup={deletePopup}
      onClosePopup={handleClosePopup}
      handleConfirmDelete={handleConfirmDelete}
    />
  );
}
