import React, { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Truck, History as HistoryIcon, Search, X } from 'lucide-react';

import { TripLoadCard } from './TripLoadCard';
import { OrderLoadCard } from './OrderLoadCard';
import { ExceptionLoadCard } from './ExceptionLoadCard';

export type TripTrackingStatus = 'pending' | 'exception' | 'on-delivery' | 'history';

interface TripSidebarProps {
  loads: any[];
  selectedLoadId?: string;
  onSelectLoad: (id: string) => void;
  onAssignLoad?: (id: string) => void;
  onReturnLoad?: (payload: { orderId: string; shipment: any }) => void;
  onRescheduleLoad?: (id: string) => void;
  onReassignLoad?: (id: string) => void;
  onDeleteLoad?: (id: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  counts: {
    pending: number;
    exception: number;
    onDelivery: number;
    history: number;
  };
}

const FilterTab = ({ 
  active, 
  label, 
  count, 
  onClick, 
  icon: Icon 
}: { 
  active: boolean, 
  label: string, 
  count?: number, 
  onClick: () => void,
  icon: React.ElementType
}) => (
  <button
    onClick={onClick}
    className={`relative flex items-center h-9 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
      active 
        ? 'bg-primary text-primary-content shadow-sm flex-1 px-4 justify-center' 
        : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50 flex-none w-9 justify-center'
    }`}
    title={!active ? label : undefined}
  >
    <Icon className={`size-4 shrink-0 ${active ? '' : 'text-slate-500'}`} />
    
    {/* Label & Active Count inside the expanded tab */}
    <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${
      active ? 'max-w-[120px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'
    }`}>
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] leading-tight font-black bg-white text-primary shadow-sm whitespace-nowrap">
          {count}
        </span>
      )}
    </div>

    {/* Inactive Badge */}
    {!active && count !== undefined && count > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold bg-primary text-white shadow-sm border border-white">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export const TripSidebar: React.FC<TripSidebarProps> = ({
  loads,
  selectedLoadId,
  onSelectLoad,
  onAssignLoad,
  onReturnLoad,
  onRescheduleLoad,
  onReassignLoad,
  onDeleteLoad,
  filter,
  setFilter,
  counts
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLoads = useMemo(() => {
    if (!searchQuery.trim()) return loads;
    
    const query = searchQuery.toLowerCase();
    return loads.filter(load => {
      const orderNum = load.order_number?.toLowerCase() || '';
      const tripNum = load.trip_number?.toLowerCase() || '';
      const tripOrderNum = load.order?.order_number?.toLowerCase() || '';

      return (
        orderNum.includes(query) ||
        tripNum.includes(query) ||
        tripOrderNum.includes(query)
      );
    });
  }, [loads, searchQuery]);

  return (
    <div className="w-full lg:w-[420px] h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 flex-none z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-6 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Trips Monitoring</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-10 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all shadow-sm"
            placeholder="Search by Trip ID or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-visible pb-2">
          <FilterTab icon={Clock} active={filter === 'pending'} label="Pending" count={counts.pending} onClick={() => setFilter('pending')} />
          <FilterTab icon={Truck} active={filter === 'on-delivery'} label="On Delivery" count={counts.onDelivery} onClick={() => setFilter('on-delivery')} />
          <FilterTab icon={AlertTriangle} active={filter === 'exception'} label="Exception" count={counts.exception} onClick={() => setFilter('exception')} />
          <FilterTab icon={HistoryIcon} active={filter === 'history'} label="History" count={counts.history} onClick={() => setFilter('history')} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-2 pb-24 space-y-4">
        {filteredLoads.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            {searchQuery.trim() ? 'No matching results found.' : 'No data found in this tab.'}
          </div>
        ) : (
          filteredLoads.map((load: any) => {
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
                    onAssign={() => onRescheduleLoad?.(load.id)}
                    onReturn={(shipment) => onReturnLoad?.({ orderId: load.id, shipment })}
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
                onReassign={onReassignLoad ? () => onReassignLoad(load.id) : undefined}
                onDelete={onDeleteLoad ? () => onDeleteLoad(load.id) : undefined}
              />
            );
          })
        )}
      </div>

    </div>
  );
};
