import React from 'react';
import { Monitor, Cpu, Wifi, Zap } from 'lucide-react';
import { WorkspaceConfigurator } from '../components/WorkspaceConfigurator';

export const WorkspacePage: React.FC = () => {
  const requirements = [
    {
      icon: Cpu,
      title: 'Процессор',
      description: 'Основная нагрузка — нужен мощный CPU',
      details: 'Intel i5/i7 или AMD Ryzen 5/7'
    },
    {
      icon: Monitor,
      title: 'Экран',
      description: 'Большая диагональ (4K/Ultrawide)',
      details: '27" минимум, 32" идеально'
    },
    {
      icon: Wifi,
      title: 'Интернет',
      description: 'Ping имеет значение',
      details: 'Проводное соединение обязательно'
    },
    {
      icon: Zap,
      title: 'Память',
      description: 'Минимум 16 ГБ RAM',
      details: '32 ГБ для комфортной работы'
    }
  ];

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Philosophy */}
          <div>
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
              Оптимальное рабочее место для интрадей-торговли
            </h1>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p className="text-lg">
                Трейдинг — это процесс принятия важных решений в условиях стресса и неопределенности.
              </p>
              <p>
                Ваше рабочее пространство должно <span className="text-cyan-400 font-semibold">выдавать максимум полезной информации</span> при минимуме когнитивной нагрузки и визуальных раздражителей.
              </p>
              <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-4 rounded-r-lg mt-6">
                <p className="text-sm text-cyan-100">
                  <span className="font-semibold">Принцип:</span> Каждый элемент на экране должен либо приносить пользу (данные для решений), либо быть убран.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Requirements */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-cyan-400" />
              Требования к оборудованию
            </h2>
            <div className="space-y-4">
              {requirements.map((req, idx) => {
                const Icon = req.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white mb-1">{req.title}</h3>
                      <p className="text-xs text-slate-400 mb-1">{req.description}</p>
                      <p className="text-xs text-cyan-400 font-mono">{req.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature: Interactive Configurator */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Интерактивный конструктор рабочего места
          </h2>
          <p className="text-slate-400">
            Выберите ваше оборудование и посмотрите оптимальную конфигурацию окон
          </p>
        </div>
        <WorkspaceConfigurator />
      </div>

      {/* Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-bold text-emerald-400 mb-2">Делайте</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Используйте темную тему</li>
            <li>• Группируйте инструменты логически</li>
            <li>• Держите новости в поле зрения</li>
            <li>• Минимум 2-4 актива одновременно</li>
          </ul>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-bold text-red-400 mb-2">Не делайте</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Не открывайте 20 графиков</li>
            <li>• Избегайте белого фона</li>
            <li>• Не смотрите TikTok во время торгов</li>
            <li>• Не перегружайте рабочее место</li>
          </ul>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-2xl">💡</span>
          </div>
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Pro Tips</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Включайте "Не беспокоить"</li>
            <li>• Используйте виртуальные столы</li>
            <li>• Сохраняйте layouts в CScalp</li>
            <li>• Поводырь всегда в углу глаза</li>
          </ul>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-700/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎯</div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">
              Главное правило
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Ваше рабочее место должно служить одной цели: <span className="text-white font-semibold">помогать принимать правильные торговые решения быстро</span>. 
              Всё остальное — отвлекающие факторы. Экспериментируйте с разными конфигурациями, но помните: 
              <span className="text-cyan-400"> меньше — значит лучше</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
