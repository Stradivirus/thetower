import RerollPanel from './RerollPanel';

export default function ModuleRerollView() {
  // 기존의 복잡한 리스트 렌더링 로직을 모두 제거하고,
  // RerollPanel 하나만 꽉 채워서 보여줍니다.
  return (
    <div className="w-full h-full overflow-hidden animate-fade-in">
      <RerollPanel />
    </div>
  );
}