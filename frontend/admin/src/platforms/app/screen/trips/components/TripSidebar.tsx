import React from 'react';

import { TripLoadCard } from './TripLoadCard';
import { OrderLoadCard } from './OrderLoadCard';
import { ExceptionLoadCard } from './ExceptionLoadCard';

export type TripTrackingStatus = 'pending' | 'exception' | 'on-delivery' | 'history';

interface TripSidebarProps {
  loads: any[];
  selectedLoadId?: string;
  onSelectLoad: (id: string) => void;
  onAssignLoad?: (id: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  counts: {
    pending: number;
    exception: number;
    onDelivery: number;
    history: number;
  };
}

const FilterTab = ({ active, label, count, onClick }: { active: boolean, label: string, count?: number, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-primary text-primary-content shadow-sm' : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-[11px] leading-tight font-black transition-colors ${
        active 
          ? 'bg-white text-primary shadow-sm' 
          : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const TripSidebar: React.FC<TripSidebarProps> = ({
  loads,
  selectedLoadId,
  onSelectLoad,
  onAssignLoad,
  filter,
  setFilter,
  counts
}) => {
  return (
    <div className="w-[420px] h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 flex-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-6 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Trips Monitoring</h1>
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterTab active={filter === 'pending'} label="Pending" count={counts.pending} onClick={() => setFilter('pending')} />
          <FilterTab active={filter === 'exception'} label="Exception" count={counts.exception} onClick={() => setFilter('exception')} />
          <FilterTab active={filter === 'on-delivery'} label="On Delivery" count={counts.onDelivery} onClick={() => setFilter('on-delivery')} />
          <FilterTab active={filter === 'history'} label="History" count={counts.history} onClick={() => setFilter('history')} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-2 pb-24 space-y-4">
        {loads.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No data found in this tab.</div>
        ) : (
          loads.map((load: any) => {
            if (filter === 'pending') {
              return (
                <OrderLoadCard
                  key={load.id}
                  order={load}
                  isSelected={selectedLoadId === load.id}
                  onClick={() => onSelectLoad(load.id)}
                  onAssign={() => onAssignLoad?.(load.id)}
                />
              );
            }
            if (filter === 'exception') {
               return (
                  <ExceptionLoadCard
                    key={`exc-${load.id}`}
                    order={load}
                    isSelected={selectedLoadId === load.id}
                    onClick={() => onSelectLoad(load.id)}
                    onAssign={() => onAssignLoad?.(load.id)}
                  />
               );
            }
            return (
              <TripLoadCard
                key={load.id}
                trip={load}
                status={filter}
                isSelected={selectedLoadId === load.id}
                onClick={() => onSelectLoad(load.id)}
              />
            );
          })
        )}
      </div>

    </div>
  );
};
