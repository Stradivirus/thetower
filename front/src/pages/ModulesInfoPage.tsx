/**
 * 파일명: thetower/front/src/pages/ModulesInfoPage.tsx
 * 용도: 사용자의 모듈(장비) 관리 페이지
 * 기능: 장착 중인 모듈 조회, 인벤토리 관리, 모듈 상세 설정(등급/효과) 제공
 */
import { MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModulePresetBar from '../components/Modules/ModulePresetBar';
import ModuleDetailModal from '../components/Modules/ModuleDetailModal';
import { useModulesData } from '../hooks/useModulesData';

export default function ModulesInfoPage() {
  const {
    token,
    modules,
    progress,
    isChanged,
    isSummaryOpen,
    setIsSummaryOpen,
    isSaving,
    viewMode,
    setViewMode,
    activePresetId,
    presets,
    detailModal,
    setDetailModal,
    handleSaveProgress,
    handleSelectPreset,
    handleRenamePreset,
    handleModuleClick,
    handleModalSave,
    handleModalDelete,
    handleModalEquip,
    handleModalUnequip,
    getEquipStatus,
    getEquippedInstanceId,
  } = useModulesData();

  return (
    <div className="w-full px-4 pb-12 animate-fade-in flex flex-col">
      {/* 상단 탭 및 저장 컨트롤 헤더 */}
      <ModuleHeader 
        handleSave={handleSaveProgress}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* 모듈 프리셋 선택 및 이름 변경 바 */}
      <ModulePresetBar
        activePresetId={activePresetId}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onRenamePreset={handleRenamePreset}
        disabled={isSaving}
      />

      {/* 모듈 목록 표시 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4 items-start">
        {MODULE_TYPES.map(type => (
          <ModuleColumn 
            key={type.id}
            moduleType={type}
            modules={modules}
            progress={progress}
            onModuleClick={handleModuleClick} 
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* 궁무/모듈 상태 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />

      {/* 모듈 상세 설정 모달 */}
      <ModuleDetailModal 
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
        moduleType={detailModal.type}
        moduleName={detailModal.name}
        currentData={detailModal.data}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onEquip={handleModalEquip}
        onUnequip={handleModalUnequip}
        equipStatus={getEquipStatus()}
        equippedInstanceId={getEquippedInstanceId()}
        isSaving={isSaving} 
        viewMode={viewMode === 'equipped' ? 'equipped' : 'inventory'}
      />
    </div>
  );
}
