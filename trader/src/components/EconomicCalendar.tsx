import React from 'react';
import { Calendar, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    date: '12.01.2026',
    time: '13:00',
    title: 'Заседание ЦБ РФ по ключевой ставке',
    importance: 'high',
    category: 'Макроэкономика'
  },
  {
    id: '2',
    date: '13.01.2026',
    time: '10:00',
    title: 'Отчет Сбербанка (SBER) за Q4 2025',
    importance: 'high',
    category: 'Отчетность'
  },
  {
    id: '3',
    date: '14.01.2026',
    time: '12:00',
    title: 'Инфляция в РФ (декабрь)',
    importance: 'medium',
    category: 'Статистика'
  },
  {
    id: '4',
    date: '15.01.2026',
    time: '09:30',
    title: 'Данные по безработице в США',
    importance: 'medium',
    category: 'Макроэкономика'
  },
  {
    id: '5',
    date: '15.01.2026',
    time: '14:00',
    title: 'Газпром: дивидендная отсечка',
    importance: 'high',
    category: 'Корпоративные события'
  },
  {
    id: '6',
    date: '16.01.2026',
    time: '11:00',
    title: 'Индекс PMI (производство)',
    importance: 'low',
    category: 'Статистика'
  },
  {
    id: '7',
    date: '17.01.2026',
    time: '10:00',
    title: 'Экспорт нефти РФ (январь)',
    importance: 'medium',
    category: 'Сырьевые рынки'
  },
  {
    id: '8',
    date: '18.01.2026',
    time: '13:00',
    title: 'Заседание ФРС США по ставке',
    importance: 'high',
    category: 'Макроэкономика'
  }
];

const EconomicCalendar: React.FC = () => {
  const getImportanceColor = (importance: CalendarEvent['importance']) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'medium':
        return 'bg-amber-500/20 border-amber-500 text-amber-400';
      case 'low':
        return 'bg-slate-500/20 border-slate-500 text-slate-400';
    }
  };

  const getImportanceIcon = (importance: CalendarEvent['importance']) => {
    switch (importance) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm sticky top-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Экономический Календарь</h2>
          <p className="text-xs text-slate-400">Ближайшие события</p>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {MOCK_EVENTS.map((event) => (
          <div
            key={event.id}
            className={`border-l-4 rounded-r-lg p-4 transition-all hover:scale-[1.02] cursor-pointer ${getImportanceColor(event.importance)}`}
          >
            {/* Date & Time */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold">{event.date}</span>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{event.time}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold mb-2 leading-tight">
              {event.title}
            </h3>

            {/* Category & Importance */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{event.category}</span>
              <div className="flex items-center gap-1 text-xs">
                {getImportanceIcon(event.importance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Важность событий:</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-slate-400">Высокая</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-slate-400">Средняя</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span className="text-slate-400">Низкая</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;
