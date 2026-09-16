/**
 * 파일명: thetower/front/src/components/Modules/ModulePresetBar.tsx
 * 용도: 모듈 장착 프리셋(1~5) 선택 및 이름 변경 컨트롤러 바
 * 기능: 프리셋 전환, 활성 프리셋 이름 인라인 수정, 키보드 인터랙션(Enter, Esc) 지원
 */
import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Bookmark } from 'lucide-react';
import type { ModulePresetsMap } from '../../types/gameData';

interface Props {
  activePresetId: number;
  presets: ModulePresetsMap;
  onSelectPreset: (presetId: number) => void;
  onRenamePreset: (presetId: number, newName: string) => void;
  disabled?: boolean;
}

export default function ModulePresetBar({
  activePresetId,
  presets,
  onSelectPreset,
  onRenamePreset,
  disabled = false
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (id: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveName = () => {
    if (editingId !== null) {
      const trimmed = editName.trim();
      if (trimmed) {
        onRenamePreset(editingId, trimmed);
      }
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const presetIds = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-slate-900/60 border border-slate-800 rounded-xl my-2 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1 text-xs font-bold text-slate-400 shrink-0 mr-1 select-none">
        <Bookmark size={14} className="text-blue-400" />
        <span className="hidden sm:inline">Presets</span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {presetIds.map((id) => {
          const preset = presets[id.toString()] || { id, name: `Preset ${id}`, slots: {} };
          const isActive = activePresetId === id;
          const isEditing = editingId === id;

          return (
            <div
              key={id}
              onClick={() => {
                if (!isActive && !isEditing && !disabled) {
                  onSelectPreset(id);
                }
              }}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 select-none
                ${isActive
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/70 hover:text-slate-200 cursor-pointer'
                }
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                isActive ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {id}
              </span>

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={16}
                    className="w-24 bg-slate-950 text-white text-xs px-1.5 py-0.5 rounded border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded"
                    title="Save"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-slate-400 hover:text-white p-0.5 rounded"
                    title="Cancel"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[100px]">{preset.name || `Preset ${id}`}</span>
                  {isActive && (
                    <button
                      onClick={(e) => startEdit(id, preset.name || `Preset ${id}`, e)}
                      className="opacity-60 hover:opacity-100 text-blue-400 hover:text-blue-200 transition-opacity p-0.5"
                      title="Rename preset"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
