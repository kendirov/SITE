import { BarChart3, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StocksGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/academy"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в Академию
      </Link>

      {/* Header */}
      <div className="glass rounded-xl p-8 border border-primary/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Что такое акция?</h1>
        </div>
        <p className="text-foreground-muted">
          Полное руководство по инвестированию в акции на Московской бирже
        </p>
      </div>

      {/* Content */}
      <div className="glass rounded-xl p-8 border border-border/50 prose prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mb-4">Определение</h2>
        <p className="text-foreground-muted mb-6">
          <strong className="text-foreground">Акция</strong> — это ценная бумага, которая
          представляет собой долю владения в компании. Покупая акцию, вы становитесь
          совладельцем бизнеса и получаете право на часть его прибыли.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Типы акций</h2>
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-semibold text-primary mb-2">Обыкновенные акции</h3>
            <p className="text-sm text-foreground-muted">
              Дают право голоса на собрании акционеров и право на дивиденды.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-semibold text-secondary mb-2">
              Привилегированные акции
            </h3>
            <p className="text-sm text-foreground-muted">
              Не дают права голоса, но гарантируют фиксированные дивиденды.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Как работает рынок акций?</h2>
        <p className="text-foreground-muted mb-6">
          На Московской бирже торговля акциями происходит в электронном виде через
          систему торгов. Основной режим торгов для акций — <strong>TQBR</strong>{' '}
          (T+ режим с расчетами на следующий день).
        </p>

        <h2 className="text-2xl font-semibold mb-4">Важные понятия</h2>
        <ul className="space-y-3 text-foreground-muted">
          <li>
            <strong className="text-foreground">Тикер</strong> — уникальный код акции
            (например, SBER для Сбербанка)
          </li>
          <li>
            <strong className="text-foreground">Лот</strong> — минимальное количество акций
            для покупки
          </li>
          <li>
            <strong className="text-foreground">Дивиденды</strong> — часть прибыли компании,
            выплачиваемая акционерам
          </li>
          <li>
            <strong className="text-foreground">Капитализация</strong> — рыночная стоимость
            всех акций компании
          </li>
        </ul>
      </div>

      {/* Call to Action */}
      <div className="glass rounded-xl p-6 border border-primary/20 glow-primary">
        <h3 className="text-lg font-semibold mb-2">Готовы начать?</h3>
        <p className="text-sm text-foreground-muted mb-4">
          Используйте наш скринер акций для анализа рынка в реальном времени
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Перейти к скринеру
        </Link>
      </div>
    </div>
  )
}
