/**
 * 파일명: thetower/front/src/components/Layout/SupportButton.tsx
 * 용도: 서비스 이용 문의 및 피드백 전송을 위한 플로팅 버튼 및 모달
 * 기능: 문의 내용 입력 폼 제공, Slack API 연동 전송, 전송 상태 피드백 표시
 */
import React, { useState } from 'react';
import { useGameData } from '../../contexts/GameDataContext';
import { T } from '../../locales'; 

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const Text = T.layout.SUPPORT; 

  const { isLoggedIn } = useGameData();

  /** 
   * 문의 내용 제출 핸들러
   * - 슬랙 웹훅과 연결된 백엔드 API로 데이터를 전송합니다.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setStatus('success');
        setContent('');
        
        // 성공 메시지 표시 후 1.5초 뒤 모달 닫기
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
        }, 1500);
      } else {
        alert(Text.ERR_SERVER);
        setStatus('idle');
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  // 비로그인 사용자에게는 고객지원 버튼을 노출하지 않음
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* 플로팅 문의 버튼 (데스크탑 전용) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
        title={Text.BUTTON_TITLE}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </button>

      {/* 문의 입력 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-xl bg-gray-800 p-6 shadow-2xl ring-1 ring-white/10">
            {status === 'success' ? (
              /* 전송 성공 피드백 화면 */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-green-500/20 p-3 text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{Text.SUCCESS_TITLE}</h3>
                <p className="mt-2 text-sm text-gray-400">{Text.SUCCESS_DESC}</p>
              </div>
            ) : (
              /* 문의 입력 폼 화면 */
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{Text.MODAL_TITLE}</h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full resize-none rounded-lg bg-gray-700 p-3 text-white placeholder-gray-400 ring-1 ring-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-line"
                    rows={5}
                    placeholder={Text.PLACEHOLDER}
                    required
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {Text.CANCEL}
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {status === 'sending' ? Text.SENDING : Text.SEND}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}