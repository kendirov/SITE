import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Laptop, Tv, 
  CheckCircle2, AlertCircle, 
  Eye, Layout, BarChart3, 
  Target, Info, Minus, Square, X,
  MousePointer2
} from 'lucide-react';

// --- ТИПЫ ---
type SetupType = 'laptop-only' | 'laptop-monitor' | 'dual-monitors' | 'laptop-tv';

interface SetupOption {
  id: SetupType;
  label: string;
  icon: React.ElementType;
  description: string;
  maxInstruments: number;
}

const SETUP_OPTIONS: SetupOption[] = [
  {
    id: 'laptop-only',
    label: 'Ноутбук (Start)',
    icon: Laptop,
    description: 'Минимализм. Фокус на 1-2 стаканах.',
    maxInstruments: 2
  },
  {
    id: 'laptop-monitor',
    label: 'Ноутбук + Монитор',
    icon: Monitor,
    description: 'Золотой стандарт новичка.',
    maxInstruments: 6
  },
  {
    id: 'dual-monitors',
    label: 'Два монитора (Pro)',
    icon: Monitor,
    description: 'Разделение: Торговля / Анализ.',
    maxInstruments: 12
  },
  {
    id: 'laptop-tv',
    label: 'Ноутбук + ТВ',
    icon: Tv,
    description: 'ТВ как обзорная панель.',
    maxInstruments: 8
  }
];

// --- КОМПОНЕНТЫ ИМИТАЦИИ CSCALP ---

// 1. СТАКАН (ORDER BOOK) - Справа
const OrderBookSection = () => {
  return (
    <div className="flex-1 flex flex-col h-full text-[7px] font-mono select-none">
      {/* ASKS (Продавцы) - Красная зона */}
      <div className="flex-1 bg-[#1a0505] flex flex-col justify-end overflow-hidden relative border-b border-slate-800">
        {[...Array(8)].map((_, i) => {
          const vol = Math.floor(Math.random() * 2000);
          const width = Math.min((vol / 2000) * 100, 100);
          return (
            <div key={`ask-${i}`} className="flex justify-between items-center px-1 py-[0.5px] relative z-10">
              {/* Гистограмма объема */}
              <div className="absolute top-0 bottom-0 left-0 bg-red-900/40 z-0" style={{ width: `${width}%` }} />
              <span className="relative z-10 text-slate-400">{vol}</span>
              <span className="relative z-10 text-red-400 font-bold">{(300.5 + (7-i)*0.1).toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {/* SPREAD (Текущая цена) */}
      <div className="h-4 bg-slate-800 flex items-center justify-center border-y border-slate-700 z-20">
        <span className="text-[8px] font-black text-white">300.45</span>
      </div>

      {/* BIDS (Покупатели) - Зеленая зона */}
      <div className="flex-1 bg-[#051a05] flex flex-col justify-start overflow-hidden relative border-t border-slate-800">
        {[...Array(8)].map((_, i) => {
          const vol = Math.floor(Math.random() * 2000);
          const width = Math.min((vol / 2000) * 100, 100);
          return (
            <div key={`bid-${i}`} className="flex justify-between items-center px-1 py-[0.5px] relative z-10">
              {/* Гистограмма объема */}
              <div className="absolute top-0 bottom-0 left-0 bg-emerald-900/40 z-0" style={{ width: `${width}%` }} />
              <span className="relative z-10 text-slate-400">{vol}</span>
              <span className="relative z-10 text-emerald-400 font-bold">{(300.4 - i*0.1).toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. ЛЕНТА СДЕЛОК (TAPE) - Посередине
const TapeSection = () => {
  return (
    <div className="w-[30px] border-r border-slate-800 bg-[#0B0E14] flex flex-col items-center justify-end py-1 gap-1 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] to-transparent z-10 pointer-events-none" />
      {[...Array(12)].map((_, i) => {
        const isBuy = Math.random() > 0.5;
        const size = 4 + Math.random() * 6; // Размер шарика
        const opacity = 1 - (i * 0.08); // Угасание вверх
        return (
          <div 
            key={i}
            className={`rounded-full shadow-sm ${isBuy ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              opacity: Math.max(opacity, 0.1)
            }}
          />
        );
      })}
    </div>
  );
};

// 3. КЛАСТЕРЫ (CLUSTERS) - Слева
const ClustersSection = () => {
  return (
    <div className="flex-1 flex border-r border-slate-800 bg-[#0f1115]">
      {/* 2 колонки истории кластеров */}
      {[...Array(2)].map((_, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col justify-end border-r border-slate-800/30">
          <div className="text-[5px] text-slate-600 text-center border-b border-slate-800/50">
            {colIndex === 0 ? '5m' : '10m'}
          </div>
          {[...Array(12)].map((_, rowIndex) => {
             // Имитация профиля объема в кластере
             const vol = Math.floor(Math.random() * 500);
             const intensity = Math.min(vol / 500, 1);
             const isGreen = Math.random() > 0.4;
             return (
               <div 
                 key={rowIndex} 
                 className={`h-full flex items-center justify-center text-[5px] font-mono ${
                    isGreen ? 'bg-emerald-500' : 'bg-red-500'
                 }`}
                 style={{ 
                   opacity: intensity * 0.4 + 0.1, // Прозрачность зависит от объема
                   color: intensity > 0.7 ? '#fff' : '#aaa'
                 }}
               >
                 {intensity > 0.3 ? vol : ''}
               </div>
             )
          })}
        </div>
      ))}
    </div>
  );
};

// --- ГЛАВНЫЙ КОМПОНЕНТ ОКНА ИНСТРУМЕНТА ---
const CScalpWindow: React.FC<{ ticker: string }> = ({ ticker }) => {
  return (
    <div className="flex flex-col h-full bg-[#14171C] border border-slate-700 rounded shadow-lg overflow-hidden group">
      {/* Header */}
      <div className="h-5 bg-[#1C2128] border-b border-slate-700 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black text-white bg-blue-600 px-1 rounded shadow-sm shadow-blue-500/50">{ticker}</span>
           <span className="text-[7px] text-slate-500 font-mono">TOM 5m</span>
        </div>
        <div className="flex gap-1 opacity-40">
          <Minus className="w-1.5 h-1.5 text-slate-400" />
          <Square className="w-1.5 h-1.5 text-slate-400" />
          <X className="w-1.5 h-1.5 text-slate-400" />
        </div>
      </div>

      {/* Body: 70% Terminal | 30% Chart */}
      <div className="flex-1 flex relative">
        {/* Визуальная линейка при наведении */}
        <div className="absolute top-0 left-0 right-0 h-0.5 z-30 flex opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="w-[70%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
           <div className="w-[30%] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,1)]"></div>
        </div>

        {/* 70%: ТЕРМИНАЛ */}
        <div className="w-[70%] flex border-r border-slate-800 overflow-hidden">
           {/* Слева направо: Кластеры -> Лента -> Стакан */}
           <ClustersSection />
           <TapeSection />
           <OrderBookSection />
        </div>

        {/* 30%: ГРАФИК */}
        <div className="w-[30%] bg-[#0B0E14] relative p-1 flex items-end">
           {/* Свечной график SVG */}
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[...Array(10)].map((_, i) => {
                 const open = 20 + Math.random() * 60;
                 const close = open + (Math.random() * 20 - 10);
                 const high = Math.max(open, close) + Math.random() * 5;
                 const low = Math.min(open, close) - Math.random() * 5;
                 const isGreen = close > open;
                 const x = i * 10 + 2;
                 const width = 6;
                 return (
                    <g key={i}>
                       <line x1={x + width/2} y1={100-high} x2={x + width/2} y2={100-low} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="0.5" />
                       <rect x={x} y={100 - Math.max(open, close)} width={width} height={Math.abs(open - close)} fill={isGreen ? '#10b981' : '#ef4444'} />
                    </g>
                 )
              })}
           </svg>
           <div className="absolute top-1 right-1 text-[6px] text-slate-500 border border-slate-800 px-0.5 rounded">5m</div>
        </div>
      </div>

      {/* Footer Labels */}
      <div className="h-2.5 bg-[#0f1115] border-t border-slate-800 flex items-center px-1">
         <div className="w-[70%] flex text-[5px] font-bold tracking-wider text-center">
            <span className="flex-1 text-slate-600">КЛАСТЕРЫ</span>
            <span className="w-[30px] text-slate-600">ЛЕНТА</span>
            <span className="flex-1 text-blue-500">СТАКАН</span>
         </div>
         <div className="w-[30%] text-[5px] text-purple-500 text-center font-bold tracking-wider">ГРАФИК</div>
      </div>
    </div>
  );
};

// --- МОНИТОР ---
const ScreenContainer: React.FC<{ 
  children: React.ReactNode; 
  title: string;
  type: 'laptop' | 'monitor' | 'tv' 
}> = ({ children, title, type }) => {
  const frameClasses = {
    laptop: 'border-b-[12px] border-x-[8px] border-t-[8px] border-slate-800 rounded-t-xl',
    monitor: 'border-[10px] border-slate-800 rounded-lg relative',
    tv: 'border-[4px] border-slate-900 rounded-sm'
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
      <div className={`relative bg-slate-900 ${frameClasses[type]} shadow-2xl w-full aspect-video flex flex-col overflow-hidden`}>
        <div className="flex-1 bg-[#0f1115] p-2 relative overflow-hidden">
          {/* Wallpaper pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          {children}
        </div>
        
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>

        {type === 'monitor' && (
           <div className="absolute -bottom-[10px] right-4 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse"></div>
        )}
      </div>
      
      {type === 'monitor' && (
        <div className="mt-0 w-24 h-6 bg-gradient-to-b from-slate-700 to-slate-800 [clip-path:polygon(15%_0,85%_0,100%_100%,0%_100%)]"></div>
      )}
      
      <p className="mt-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">{title}</p>
    </div>
  );
};

// --- ГЛАВНАЯ СТРАНИЦА ---
export const WorkspacePage: React.FC = () => {
  const [activeSetup, setActiveSetup] = useState<SetupType>('laptop-monitor');

  const renderVisualization = () => {
    switch(activeSetup) {
      case 'laptop-only':
        return (
          <div className="max-w-lg mx-auto">
             <ScreenContainer title='MacBook Pro 14"' type="laptop">
                <div className="grid grid-cols-2 gap-1 h-full">
                   <CScalpWindow ticker="SBER" />
                   <CScalpWindow ticker="GAZP" />
                </div>
             </ScreenContainer>
          </div>
        );
      case 'laptop-monitor':
        return (
          <div className="grid grid-cols-12 gap-6 items-end max-w-4xl mx-auto">
             <div className="col-span-4">
               <ScreenContainer title='Ноутбук (News/Chats)' type="laptop">
                  <div className="h-full flex flex-col gap-1 p-2 opacity-30">
                     <div className="h-8 bg-slate-700 rounded w-full"></div>
                     <div className="flex-1 bg-slate-800 rounded w-full"></div>
                  </div>
               </ScreenContainer>
             </div>
             <div className="col-span-8">
               <ScreenContainer title='Основной Монитор (Trading)' type="monitor">
                  <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
                    {['SBER', 'LKOH', 'VTBR', 'GAZP', 'ROSN', 'YNDX'].map(t => (
                       <CScalpWindow key={t} ticker={t} />
                    ))}
                  </div>
               </ScreenContainer>
             </div>
          </div>
        );
      case 'dual-monitors':
        return (
          <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
             <ScreenContainer title='Monitor 1 (Active)' type="monitor">
                <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
                   {['SBER', 'LKOH', 'VTBR', 'MGNT', 'GMKN', 'PLZL'].map(t => <CScalpWindow key={t} ticker={t} />)}
                </div>
             </ScreenContainer>
             <ScreenContainer title='Monitor 2 (Watching)' type="monitor">
                <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
                   {['MOEX', 'AFKS', 'MTSS', 'OZON', 'TRNFP', 'SNGS'].map(t => <CScalpWindow key={t} ticker={t} />)}
                </div>
             </ScreenContainer>
          </div>
        );
       case 'laptop-tv':
        return (
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
             <div className="w-full">
               <ScreenContainer title='TV 4K (Charts View)' type="tv">
                  <div className="grid grid-cols-4 gap-1 h-full">
                     {[...Array(8)].map((_,i) => (
                        <div key={i} className="bg-[#0B0E14] border border-slate-800 rounded relative p-2">
                           {/* Simplified chart for TV */}
                           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
                           <div className="h-full w-full flex items-end gap-1">
                              {[...Array(5)].map((_,j) => <div key={j} className="flex-1 bg-emerald-500/50" style={{height: `${20 + Math.random()*60}%`}} />)}
                           </div>
                        </div>
                     ))}
                  </div>
               </ScreenContainer>
             </div>
             <div className="w-2/3">
               <ScreenContainer title='Laptop (Execution)' type="laptop">
                  <div className="grid grid-cols-2 gap-1 h-full">
                     <CScalpWindow ticker="SBER" />
                     <CScalpWindow ticker="LKOH" />
                  </div>
               </ScreenContainer>
             </div>
          </div>
        );
    }
  };

  const bestPractices = [
    { icon: Eye, title: 'Уровень глаз', desc: 'Верхняя треть монитора на уровне глаз.', color: 'text-emerald-400' },
    { icon: Layout, title: '6 окон на экран', desc: 'Больше 6 стаканов на 1080p — каша в голове.', color: 'text-blue-400' },
    { icon: BarChart3, title: 'Таймфрейм 5m', desc: 'Золотой стандарт. 1m — шум, 1h — долго.', color: 'text-cyan-400' },
    { icon: Target, title: '70/30 Пропорция', desc: '70% — Привод (Стакан), 30% — График.', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 font-sans p-6 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="max-w-[1800px] mx-auto mb-10 flex items-end justify-between border-b border-slate-800 pb-6">
        <div>
           <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
              <Layout className="w-8 h-8 text-blue-500" />
              Рабочее Пространство
           </h1>
           <p className="text-sm text-slate-500 font-mono uppercase tracking-widest pl-1">
              Интерактивный конструктор торгового места
           </p>
        </div>
        <div className="hidden md:flex gap-2">
           <span className="px-3 py-1 bg-blue-900/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">CScalp Ready</span>
           <span className="px-3 py-1 bg-purple-900/20 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">Pro Setup</span>
        </div>
      </div>

      {/* SELECTOR */}
      <div className="max-w-[1800px] mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {SETUP_OPTIONS.map((opt) => {
             const Icon = opt.icon;
             const active = activeSetup === opt.id;
             return (
               <button
                 key={opt.id}
                 onClick={() => setActiveSetup(opt.id)}
                 className={`relative p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden ${
                   active 
                   ? 'bg-[#14171C] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]' 
                   : 'bg-[#14171C] border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                 }`}
               >
                 <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                       <Icon className="w-6 h-6" />
                    </div>
                    {active && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                 </div>
                 <h3 className={`font-black uppercase text-sm mb-2 ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h3>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{opt.description}</p>
               </button>
             )
           })}
        </div>
      </div>

      {/* VISUALIZATION */}
      <div className="max-w-[1800px] mx-auto bg-[#0f1115] rounded-[2rem] border border-slate-800 p-10 shadow-2xl mb-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_70%)] pointer-events-none" />
         
         <div className="relative z-10 min-h-[550px] flex items-center justify-center">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeSetup}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ duration: 0.3 }}
                 className="w-full"
               >
                  {renderVisualization()}
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Legend Overlay */}
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Стакан</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Лента</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-red-500/50" /> Кластеры</div>
         </div>
      </div>

      {/* INFO GRID */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* TIPS */}
         <div className="bg-[#14171C] rounded-3xl border border-slate-800 p-8">
            <h3 className="text-white font-black uppercase tracking-widest mb-8 flex items-center gap-3">
               <Info className="w-5 h-5 text-blue-500" />
               Принципы организации
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {bestPractices.map((bp, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 bg-[#0B0E14] rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group">
                     <div className="flex items-center gap-2">
                        <bp.icon className={`w-4 h-4 ${bp.color}`} />
                        <span className="text-xs font-bold text-white uppercase">{bp.title}</span>
                     </div>
                     <p className="text-[10px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{bp.desc}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* 70/30 EXPLAINER */}
         <div className="bg-gradient-to-br from-blue-950/30 to-purple-950/30 rounded-3xl border border-blue-500/10 p-8 relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <h3 className="text-blue-400 font-black uppercase tracking-widest flex items-center gap-3">
                     <MousePointer2 className="w-5 h-5" />
                     Анатомия Окна
                  </h3>
                  <span className="px-2 py-1 bg-blue-500/10 rounded text-[9px] font-mono text-blue-300 uppercase">Interactive</span>
               </div>
               
               <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
                  Мы делим окно в пропорции <span className="text-white font-bold">70% на 30%</span>. 
                  Терминал (слева) — это кабина пилота. График (справа) — это карта местности.
               </p>
               
               {/* Interactive Bar */}
               <div className="h-16 w-full flex rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                  <div className="w-[70%] bg-[#0B0E14] flex flex-col items-center justify-center text-blue-500 border-r border-slate-800 relative hover:bg-[#11141a] transition-colors cursor-help">
                     <span className="text-xs font-black tracking-widest">70% ТЕРМИНАЛ</span>
                     <span className="text-[8px] text-slate-600 mt-1 uppercase">Кластеры • Лента • Стакан</span>
                  </div>
                  <div className="w-[30%] bg-[#0f1115] flex flex-col items-center justify-center text-purple-500 relative hover:bg-[#16191f] transition-colors cursor-help">
                     <span className="text-xs font-black tracking-widest">30% ГРАФИК</span>
                     <span className="text-[8px] text-slate-600 mt-1 uppercase">История цены</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default WorkspacePage;