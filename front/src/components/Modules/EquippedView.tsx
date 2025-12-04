import { X } from 'lucide-react';
// [Fixed] type 키워드 추가
import { MODULE_TYPES, RARITIES, DISPLAY_ORDER, type EquippedModule } from './ModuleConstants';

interface Props {
  modulesState: Record<string, any>;
  isAssistMode: boolean;
  onRemove: (key: string) => void;
}

export default function EquippedView({ modulesState, isAssistMode, onRemove }: Props) {
  return (
    <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min content-start overflow-y-auto pr-2">
      {DISPLAY_ORDER.map(typeId => {
        const type = MODULE_TYPES.find(t => t.id === typeId)!;
        // 타입으로 사용
        const mainModule = modulesState[`equipped_${type.id}_main`] as EquippedModule | undefined;
        const subModule = modulesState[`equipped_${type.id}_sub`] as EquippedModule | undefined;
        const hasEquipped = mainModule || subModule;

        return (
          <div key={type.id} className={`bg-slate-900 border ${hasEquipped ? type.border : 'border-slate-800'} rounded-2xl p-5 transition-all h-fit`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${type.bg}`}>
                <type.icon size={20} className={hasEquipped ? type.color : 'text-slate-500'} />
              </div>
              <span className={`text-lg font-bold ${hasEquipped ? 'text-slate-200' : 'text-slate-600'}`}>{type.label}</span>
            </div>

            <div className="space-y-3">
              {/* Main Slot */}
              <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20 shadow-sm">MAIN</span>
                    {mainModule && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[mainModule.rarity].bg} ${RARITIES[mainModule.rarity].color} ${RARITIES[mainModule.rarity].border}`}>
                        {RARITIES[mainModule.rarity].short}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium truncate ${mainModule ? 'text-white' : 'text-slate-600 italic'}`}>
                    {mainModule?.name || "Empty"}
                  </span>
                </div>
                {mainModule && (
                  <button onClick={() => onRemove(`equipped_${type.id}_main`)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors">
                    <X size={14}/>
                  </button>
                )}
              </div>

              {/* Sub Slot */}
              {(isAssistMode || subModule) && (
                <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 animate-fade-in">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 shadow-sm">ASSIST</span>
                      {subModule && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[subModule.rarity].bg} ${RARITIES[subModule.rarity].color} ${RARITIES[subModule.rarity].border}`}>
                          {RARITIES[subModule.rarity].short}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-medium truncate ${subModule ? 'text-white' : 'text-slate-600 italic'}`}>
                      {subModule?.name || "Empty"}
                    </span>
                  </div>
                  {subModule && (
                    <button onClick={() => onRemove(`equipped_${type.id}_sub`)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors">
                      <X size={14}/>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}