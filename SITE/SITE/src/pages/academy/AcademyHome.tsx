import { Link } from 'react-router-dom'
import { BookOpen, BarChart3, Sparkles, TrendingUp } from 'lucide-react'

export default function AcademyHome() {
  const guides = [
    {
      path: '/academy/stocks',
      title: 'Что такое акция?',
      description: 'Узнайте основы инвестирования в акции',
      icon: BarChart3,
      color: 'primary',
    },
    {
      path: '/academy/futures',
      title: 'Что такое фьючерс?',
      description: 'Разберитесь с производными инструментами',
      icon: Sparkles,
      color: 'secondary',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-accent" />
          Академия
        </h1>
        <p className="text-foreground-muted mt-2">
          База знаний для начинающих и профессиональных трейдеров
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const Icon = guide.icon
          return (
            <Link
              key={guide.path}
              to={guide.path}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 group"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${guide.color}/10 mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-6 h-6 text-${guide.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
              <p className="text-foreground-muted text-sm">{guide.description}</p>
            </Link>
          )
        })}
      </div>

      {/* Welcome Card */}
      <div className="glass rounded-xl p-8 border border-accent/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Добро пожаловать в Академию!</h3>
            <p className="text-foreground-muted mb-4">
              Здесь вы найдете всю необходимую информацию о торговле на Московской бирже,
              от базовых понятий до продвинутых стратегий.
            </p>
            <ul className="space-y-2 text-sm text-foreground-muted">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Основы работы с акциями и фьючерсами
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Режимы торгов Московской биржи
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Практические примеры и кейсы
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
