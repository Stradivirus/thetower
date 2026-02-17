/**
 * 파일명: thetower/front/src/components/Stones/Unlock/UwCostTable.tsx
 * 용도: 무기 해금(Unlock) 비용을 보여주는 데이터 테이블
 * 기능: 해금 순서에 따른 비용 표시, 다음 해금 대상 강조, 누적 비용 계산 및 초기화 기능
 */
import { stoneStyles as styles, formatNum, ResetButton } from '../StoneShared';

interface Props {
  title: string;                                         // 테이블 제목
  type: 'base' | 'plus';                                 // 해금 타입 (기본 무기 또는 UW+)
  costs: number[];                                       // 순서별 비용 배열
  unlockedCount: number;                                 // 현재까지 해금된 개수
  onRowClick: (type: 'base' | 'plus', count: number, totalCost: number) => void; // 행 클릭 핸들러
  onReset: (type: 'base' | 'plus') => void;              // 리셋 버튼 클릭 핸들러
}

export default function UwCostTable({ title, type, costs, unlockedCount, onRowClick, onReset }: Props) {
  /** 아직 해금되지 않은 남은 데이터들만 추출합니다. */
  const remainingData = costs
    .map((cost, idx) => ({ cost, level: idx + 1 }))
    .filter(item => item.level > unlockedCount);
    
  const totalRemaining = remainingData.reduce((acc, cur) => acc + cur.cost, 0);

  return (
    <div className={styles.card}>
      {/* 테이블 헤더: 제목 및 리셋 버튼 */}
      <div className={styles.uwHeader}>
        <span>{title}</span>
        {unlockedCount > 0 && (
          <ResetButton onClick={(e) => { e.stopPropagation(); onReset(type); }} />
        )}
      </div>

      <table className="w-full text-xs text-left">
        <thead>
          <tr>
            <th className={styles.th}>Order</th>
            <th className={styles.th}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {remainingData.map((item, index) => {
            const batchItems = remainingData.slice(0, index + 1);
            const batchCost = batchItems.reduce((sum, i) => sum + i.cost, 0);
            const batchCount = batchItems.length;
            const isNext = index === 0; // 바로 다음 해금 순서 여부

            return (
              <tr 
                key={item.level} 
                onClick={() => onRowClick(type, batchCount, batchCost)} 
                className="transition-all border-b border-slate-800/50 hover:bg-blue-500/10 cursor-pointer group"
              >
                <td className={styles.td}>
                  #{item.level}
                  {isNext ? (
                    <span className="ml-2 text-[10px] text-blue-400 font-bold animate-pulse">Next</span>
                  ) : (
                    <span className="ml-2 text-[10px] text-slate-500 group-hover:text-blue-300 font-medium">(+{batchCount})</span>
                  )}
                </td>
                <td className={`${styles.td} ${isNext ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                  {formatNum(item.cost)}
                </td>
              </tr>
            );
          })}
          {/* 모든 아이템 해금 시 */}
          {remainingData.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                All Unlocked! 🎉
              </td>
            </tr>
          )}
        </tbody>
        {/* 하단 요약: 남은 총 비용 */}
        {remainingData.length > 0 && (
          <tfoot>
            <tr>
              <td className={styles.tfootTd}>Remaining Total</td>
              <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalRemaining)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}