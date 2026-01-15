import React from 'react';
import { BookOpen, Target, TrendingUp, Layers } from 'lucide-react';
import { TerminalAnatomy } from '../components/TerminalAnatomy';
import { AnatomyDiagram } from '../components/AnatomyDiagram';

export const SimulatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Header */}
      <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">
              Анатомия Скальперского Привода
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Интерактивный атлас торгового интерфейса • Наведите курсор на пульсирующие точки
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-[400px_1fr] gap-8">
          {/* LEFT: Educational Text */}
          <div className="space-y-6">
            {/* What is DOM */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Что такое Стакан (DOM)?</h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                DOM (Depth of Market) — это интерфейс, который показывает **все активные лимитные заявки** 
                на покупку и продажу в режиме реального времени.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Профессиональные трейдеры используют его для анализа спроса/предложения, 
                поиска крупных игроков и принятия решений о точке входа.
              </p>
            </div>

            {/* Three Layers */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Три слоя информации</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">Кластеры (История)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Проторгованный объем на каждой цене. Помогает найти "следы китов".
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">Лента (Настоящее)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Реальные сделки, происходящие прямо сейчас. Зеленые = покупки, Красные = продажи.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">Стакан (Будущее)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Лимитные заявки. Если цена дойдет до них, произойдут сделки.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Concepts */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">Ключевые концепции</h2>
              </div>
              
              <div className="space-y-3 text-sm text-slate-300">
                <div>
                  <span className="font-bold text-emerald-400">Агрессор (Initiator):</span> 
                  <span className="text-slate-400"> Трейдер, который покупает/продает "по рынку".</span>
                </div>
                
                <div>
                  <span className="font-bold text-red-400">Плотность (Wall):</span> 
                  <span className="text-slate-400"> Крупная заявка, которая может остановить движение цены.</span>
                </div>
                
                <div>
                  <span className="font-bold text-cyan-400">Спред:</span> 
                  <span className="text-slate-400"> Разница между лучшим Bid и Ask. Чем меньше, тем ликвиднее.</span>
                </div>
                
                <div>
                  <span className="font-bold text-yellow-400">Дельта:</span> 
                  <span className="text-slate-400"> Разница между покупками и продажами на уровне.</span>
                </div>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-lg p-6">
              <h3 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                💡 PRO TIP
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Настоящие скальперы следят за **"разъеданием плотности"** — когда крупная заявка 
                начинает уменьшаться (кто-то ее снимает или исполняет), это сигнал о возможном движении цены.
              </p>
            </div>
          </div>

          {/* RIGHT: Interactive Anatomy */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Интерактивный Атлас
                  </h2>
                  <p className="text-xs text-slate-400">
                    Наведите курсор на пульсирующие точки для подробных объяснений
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400 font-semibold">6 hotspots</span>
                </div>
              </div>
              
              <TerminalAnatomy />
            </div>

            {/* Legend */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3">Легенда</h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-slate-300">Ask (Продавцы)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded" />
                  <span className="text-slate-300">Bid (Покупатели)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-500 rounded" />
                  <span className="text-slate-300">Текущая цена</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded animate-pulse" />
                  <span className="text-slate-300">Hotspot (Наведи курсор)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-700/60 rounded" />
                  <span className="text-slate-300">Больше покупок</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-700/60 rounded" />
                  <span className="text-slate-300">Больше продаж</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Diagram Section */}
      <div className="border-t-4 border-yellow-500/20 mt-12">
        <AnatomyDiagram />
      </div>
    </div>
  );
};

export default SimulatorPage;
