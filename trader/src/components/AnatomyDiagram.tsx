import React from 'react';

export const AnatomyDiagram: React.FC = () => {
  // Mock data for order book levels
  const askLevels = [
    { price: 76.7, volume: 450 },
    { price: 76.5, volume: 320 },
    { price: 76.3, volume: 580 },
    { price: 76.1, volume: 290 },
  ];

  const bidLevels = [
    { price: 75.9, volume: 410 },
    { price: 75.7, volume: 560 },
    { price: 75.5, volume: 380 },
    { price: 75.1, volume: 490 },
  ];

  // Mock bubbles for tape
  const bubbles = [
    { x: '20%', y: '15%', size: 60, color: 'red', volume: '120' },
    { x: '60%', y: '35%', size: 40, color: 'green', volume: '45' },
    { x: '35%', y: '55%', size: 50, color: 'green', volume: '78' },
    { x: '70%', y: '70%', size: 30, color: 'red', volume: '23' },
    { x: '25%', y: '80%', size: 35, color: 'green', volume: '34' },
    { x: '55%', y: '25%', size: 25, color: 'red', volume: '12' },
  ];

  return (
    <div className="w-full bg-slate-950 py-12">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT COLUMN: Theory */}
          <div className="col-span-3 space-y-6">
            {/* Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                Анатомия Привода
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Базовые элементы интерфейса профессионального трейдера
              </p>
            </div>

            {/* Block 1: Order Book */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
                Биржевой стакан
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Таблица всех активных лимитных заявок на покупку (Bid) и продажу (Ask). 
                Показывает спрос и предложение в реальном времени.
              </p>
            </div>

            {/* Block 2: Tape */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
                Лента сделок
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Поток исполненных сделок. <span className="text-emerald-400 font-semibold">Зеленый круг</span> — 
                рыночная покупка. <span className="text-red-400 font-semibold">Красный круг</span> — 
                рыночная продажа. Размер = объем.
              </p>
            </div>

            {/* Block 3: Clusters */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
                Кластеры
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                История проторгованных объемов на каждом уровне цены. 
                Помогает найти "следы крупных игроков" и важные уровни поддержки/сопротивления.
              </p>
            </div>

            {/* Pro Tip */}
            <div className="mt-8 p-4 bg-yellow-900/10 border-l-2 border-yellow-400">
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="text-yellow-400 font-bold">💡 Совет:</span> Профессиональные скальперы 
                следят за всеми тремя окнами одновременно, чтобы видеть полную картину рынка.
              </p>
            </div>
          </div>

          {/* CENTER COLUMN: Visual */}
          <div className="col-span-6 relative">
            <div className="bg-slate-900 border border-slate-700 p-6" style={{ height: '600px' }}>
              <div className="grid grid-cols-3 gap-4 h-full">
                {/* Column 1: Clusters */}
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase text-center mb-2">
                    Кластеры
                  </div>
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border border-slate-700 bg-slate-800/30 flex items-center justify-center"
                    >
                      <span className="text-[10px] text-slate-500 font-mono">
                        {Math.floor(Math.random() * 200 + 50)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Column 2: Tape (Time & Sales) */}
                <div className="relative bg-slate-800/50 border border-slate-700">
                  <div className="absolute top-0 left-0 right-0 text-[10px] text-slate-500 font-bold uppercase text-center py-1">
                    Лента
                  </div>
                  
                  {/* Bubbles */}
                  {bubbles.map((bubble, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: bubble.x,
                        top: bubble.y,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div
                        className={`rounded-full flex items-center justify-center font-mono font-bold text-[9px] ${
                          bubble.color === 'green'
                            ? 'bg-emerald-500/40 text-emerald-100 border-2 border-emerald-400'
                            : 'bg-red-500/40 text-red-100 border-2 border-red-400'
                        }`}
                        style={{ width: bubble.size, height: bubble.size }}
                      >
                        {bubble.volume}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 3: Order Book */}
                <div className="flex flex-col border border-slate-700">
                  <div className="text-[10px] text-slate-500 font-bold uppercase text-center py-1 border-b border-slate-700">
                    Стакан
                  </div>
                  
                  {/* Asks (Sellers) - Top */}
                  <div className="flex-1 flex flex-col justify-end gap-1 p-2">
                    {askLevels.map((level, i) => (
                      <div
                        key={`ask-${i}`}
                        className="h-8 bg-red-500 flex items-center justify-between px-2 border border-red-600"
                        style={{ opacity: 0.7 - i * 0.1 }}
                      >
                        <span className="text-[10px] font-mono font-bold text-red-100">
                          {level.price.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-mono text-red-100">
                          {level.volume}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="h-6 bg-slate-950 border-y-2 border-cyan-500 flex items-center justify-center">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                      Спред
                    </span>
                  </div>

                  {/* Bids (Buyers) - Bottom */}
                  <div className="flex-1 flex flex-col gap-1 p-2">
                    {bidLevels.map((level, i) => (
                      <div
                        key={`bid-${i}`}
                        className="h-8 bg-emerald-500 flex items-center justify-between px-2 border border-emerald-600"
                        style={{ opacity: 0.7 - i * 0.1 }}
                      >
                        <span className="text-[10px] font-mono font-bold text-emerald-100">
                          {level.price.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-100">
                          {level.volume}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Overlay for connection lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Line from "Список продавцов" to red zone */}
              <line
                x1="100%"
                y1="25%"
                x2="85%"
                y2="25%"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              
              {/* Line from "Best Ask" to bottom red bar */}
              <line
                x1="100%"
                y1="42%"
                x2="85%"
                y2="42%"
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              
              {/* Line from "Спред" to spread zone */}
              <line
                x1="100%"
                y1="50%"
                x2="85%"
                y2="50%"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              
              {/* Line from "Best Bid" to top green bar */}
              <line
                x1="100%"
                y1="58%"
                x2="85%"
                y2="58%"
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              
              {/* Line from "Список покупателей" to green zone */}
              <line
                x1="100%"
                y1="75%"
                x2="85%"
                y2="75%"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>
          </div>

          {/* RIGHT COLUMN: Callouts */}
          <div className="col-span-3 space-y-8 pt-12">
            {/* Callout 1: Ask List */}
            <div className="relative pl-4 border-l-2 border-red-500" style={{ marginTop: '10%' }}>
              <h4 className="text-xs font-bold text-red-400 mb-1 uppercase tracking-wide">
                Список продавцов
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Лимитные заявки на продажу, упорядоченные по цене. 
                Верхние уровни = более дорогие.
              </p>
            </div>

            {/* Callout 2: Best Ask */}
            <div className="relative pl-4 border-l-2 border-yellow-500">
              <h4 className="text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wide">
                Best Ask
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Самая низкая цена, по которой кто-то готов продать прямо сейчас.
              </p>
            </div>

            {/* Callout 3: Spread */}
            <div className="relative pl-4 border-l-2 border-cyan-500">
              <h4 className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wide">
                Спред
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Разница между Best Ask и Best Bid. Чем меньше спред — тем ликвиднее инструмент.
              </p>
            </div>

            {/* Callout 4: Best Bid */}
            <div className="relative pl-4 border-l-2 border-yellow-500">
              <h4 className="text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wide">
                Best Bid
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Самая высокая цена, по которой кто-то готов купить прямо сейчас.
              </p>
            </div>

            {/* Callout 5: Bid List */}
            <div className="relative pl-4 border-l-2 border-emerald-500">
              <h4 className="text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wide">
                Список покупателей
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Лимитные заявки на покупку. Нижние уровни = более низкие цены.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
