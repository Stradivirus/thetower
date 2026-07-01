/**
 * 파일명: thetower/front/src/components/Stones/Unlock/BotUnlockTable.tsx
 * 용도: 신규 Bot+ 해금 및 동기화(Synchronicity) 비용 관리 테이블
 * 기능: 봇별 해금 토글, 동기화 단계별 업그레이드 선택 및 봇 해금 여부에 따른 조작 잠금 처리
 */
import { Lock } from 'lucide-react';
import { stoneStyles as styles, formatNum, ResetButton } from '../StoneShared';

interface Props {
  progress: Record<string, any>;
  updateProgress: (key: string, value: any) => void;
  updateBatch: (updates: Record<string, any>) => void;
}

export default function BotUnlockTable({ progress, updateProgress, updateBatch }: Props) {
  const bots = [
    { id: 'golden', label: 'Golden Bot +' },
    { id: 'amplify', label: 'Amplify Bot +' },
    { id: 'thunder', label: 'Thunder Bot +' },
    { id: 'flame', label: 'Flame Bot +' },
    { id: 'bot', label: 'Bot Bot +' },
  ];

  const synchLevels = [
    { level: 0, label: 'Locked', cost: 0, cumulative: 0, remaining: 6000 },
    { level: 1, label: 'Unlock (2 slots)', cost: 1500, cumulative: 1500, remaining: 4500 },
    { level: 2, label: '3 Slots', cost: 1500, cumulative: 3000, remaining: 3000 },
    { level: 3, label: '4 Slots', cost: 1500, cumulative: 4500, remaining: 1500 },
    { level: 4, label: '5 Slots', cost: 1500, cumulative: 6000, remaining: 0 },
  ];

  // 해금된 봇 개수 계산
  const unlockedBotsCount = bots.filter(b => progress[`bot_plus_${b.id}`] === 1).length;
  const allBotsUnlocked = unlockedBotsCount === bots.length;
  const botRemainingTotal = (bots.length - unlockedBotsCount) * 1250;

  // 동기화 단계 계산 (모든 봇 해금 조건 미달 시 0단계로 강제 고정)
  const currentSynchLevel = allBotsUnlocked ? (progress['bot_synchronicity'] || 0) : 0;
  const synchRemaining = 6000 - (currentSynchLevel * 1500);

  /** 개별 봇 해금 상태 토글 핸들러 */
  const handleBotToggle = (botId: string) => {
    const key = `bot_plus_${botId}`;
    const nextVal = progress[key] === 1 ? 0 : 1;

    // 만약 봇이 하나라도 잠기는 경우 동기화 단계도 강제로 0으로 초기화
    if (nextVal === 0 && allBotsUnlocked) {
      updateBatch({
        [key]: 0,
        'bot_synchronicity': 0,
      });
    } else {
      updateProgress(key, nextVal);
    }
  };

  /** 동기화 단계 선택 핸들러 */
  const handleSynchSelect = (level: number) => {
    if (!allBotsUnlocked) return;
    updateProgress('bot_synchronicity', level);
  };

  /** 전체 봇 해금 및 동기화 초기화 */
  const handleReset = () => {
    const updates: Record<string, any> = {
      'bot_synchronicity': 0,
    };
    bots.forEach(b => {
      updates[`bot_plus_${b.id}`] = 0;
    });
    updateBatch(updates);
  };

  const isAnyBotUnlocked = unlockedBotsCount > 0 || currentSynchLevel > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Bot+ Unlock Costs 테이블 */}
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>Bot+ Unlock Costs</span>
          {isAnyBotUnlocked && (
            <ResetButton onClick={handleReset} />
          )}
        </div>
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              <th className={styles.th}>Bot Name</th>
              <th className={styles.th}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot) => {
              const isUnlocked = progress[`bot_plus_${bot.id}`] === 1;
              return (
                <tr
                  key={bot.id}
                  onClick={() => handleBotToggle(bot.id)}
                  className={`border-b border-slate-800/50 transition-colors cursor-pointer hover:bg-slate-800/30`}
                >
                  <td className={styles.td}>
                    <span className={isUnlocked ? 'text-green-400 font-bold' : 'text-slate-500'}>
                      {bot.label}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {isUnlocked ? (
                      <span className="text-slate-500 line-through">1,250</span>
                    ) : (
                      <span className="text-green-400 font-bold">1,250</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.tfootTd}>Remaining Total</td>
              <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(botRemainingTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 2. Synchronicity Costs 테이블 (Requires all Bot+) */}
      <div className={`${styles.card} relative ${!allBotsUnlocked ? 'opacity-40' : ''}`}>
        <div className={styles.uwHeader}>
          <span>Synchronicity Costs</span>
        </div>

        {/* 미해금 시 블러 오버레이 */}
        {!allBotsUnlocked && (
          <div className="absolute inset-0 bg-slate-950/80 z-10 flex flex-col items-center justify-center text-center p-4">
            <Lock size={16} className="text-slate-500 mb-1" />
            <span className="text-[11px] text-slate-400 font-bold">Requires all Bot+ unlocked</span>
            <span className="text-[9px] text-slate-600">({unlockedBotsCount}/{bots.length} Unlocked)</span>
          </div>
        )}

        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              <th className={styles.th}>Value</th>
              <th className={styles.th}>Cost</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {synchLevels.map((lvl) => {
              const isActive = currentSynchLevel === lvl.level;
              return (
                <tr
                  key={lvl.level}
                  onClick={() => handleSynchSelect(lvl.level)}
                  className={`border-b border-slate-800/50 transition-colors ${allBotsUnlocked ? 'cursor-pointer hover:bg-slate-800/30' : 'cursor-default'} ${isActive ? 'bg-slate-800/50' : ''}`}
                >
                  <td className={styles.td}>
                    <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                      {lvl.label}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={lvl.cost > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}>
                      {lvl.cost > 0 ? formatNum(lvl.cost) : '0'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={lvl.cumulative > 0 ? 'text-purple-400 font-bold' : 'text-slate-600'}>
                      {lvl.cumulative > 0 ? formatNum(lvl.cumulative) : '0'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={isActive ? 'text-yellow-400 font-bold' : 'text-slate-500'}>
                      {formatNum(lvl.remaining)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.tfootTd} colSpan={3}>Remaining Total</td>
              <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(synchRemaining)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
