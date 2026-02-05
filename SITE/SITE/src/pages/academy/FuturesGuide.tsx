import { Sparkles, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FuturesGuide() {
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
      <div className="glass rounded-xl p-8 border border-secondary/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Что такое фьючерс?</h1>
        </div>
        <p className="text-foreground-muted">
          Введение в производные финансовые инструменты
        </p>
      </div>

      {/* Content */}
      <div className="glass rounded-xl p-8 border border-border/50 prose prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mb-4">Определение</h2>
        <p className="text-foreground-muted mb-6">
          <strong className="text-foreground">Фьючерс</strong> — это производный финансовый
          инструмент (дериватив), представляющий собой контракт на покупку или продажу
          актива в будущем по заранее оговоренной цене.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Ключевые особенности</h2>
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-semibold text-secondary mb-2">Кредитное плечо</h3>
            <p className="text-sm text-foreground-muted">
              Для торговли фьючерсами нужна только гарантийная маржа, а не полная стоимость
              контракта.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-semibold text-secondary mb-2">Срок экспирации</h3>
            <p className="text-sm text-foreground-muted">
              Каждый контракт имеет дату истечения, после которой происходят расчеты.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-lg font-semibold text-secondary mb-2">Двусторонняя торговля</h3>
            <p className="text-sm text-foreground-muted">
              Можно зарабатывать как на росте, так и на падении рынка.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Рынок FORTS</h2>
        <p className="text-foreground-muted mb-6">
          <strong>FORTS</strong> (Futures and Options RTS) — срочный рынок Московской
          биржи, где торгуются фьючерсы и опционы на акции, индексы, валюты и товары.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Риски</h2>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-foreground-muted">
            ⚠️ Фьючерсы — это высокорискованный инструмент. Использование кредитного
            плеча может привести к значительным убыткам. Торгуйте ответственно!
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="glass rounded-xl p-6 border border-secondary/20 glow-secondary">
        <h3 className="text-lg font-semibold mb-2">Готовы к срочному рынку?</h3>
        <p className="text-sm text-foreground-muted mb-4">
          Изучите фьючерсы на нашем специализированном скринере
        </p>
        <Link
          to="/futures"
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Перейти к фьючерсам
        </Link>
      </div>
    </div>
  )
}
