// src/components/StatGrid.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StatGridProps {
  data: Record<string, string | number>;
  icon: any;
  title: string;
  color: string;
  defaultOpen?: boolean;
}

export default function StatGrid({ data, icon: Icon, title, color, defaultOpen = false }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left"
      >
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}>
          <Icon size={20} /> {title}
        </h3>
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-500" />
        ) : (
          <ChevronDown size={20} className="text-slate-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-4 gap-x-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-slate-500 mb-0.5">{key}</span>
                <span className="text-slate-200 font-medium font-mono text-sm truncate" title={String(value)}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}