import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchMarketNews, type NewsItem } from '../api/news';

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarketNews();
      setNews(data);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Не удалось загрузить новости. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
      } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      }
    } catch {
      return '';
    }
  };

  const highlightHashtags = (text: string) => {
    const parts = text.split(/(#[A-Z0-9]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-blue-400 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Market Twits Live</h2>
            <p className="text-xs text-slate-400">Telegram @markettwits</p>
          </div>
        </div>
        <div className="h-[600px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-400">Загрузка новостей...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Market Twits Live</h2>
            <p className="text-xs text-slate-400">Telegram @markettwits</p>
          </div>
        </div>
        <div className="h-[600px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm font-semibold text-purple-400 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Market Twits Live</h2>
            <p className="text-xs text-slate-400">Telegram @markettwits • {news.length} постов</p>
          </div>
        </div>
        <button
          onClick={fetchNews}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Обновить"
        >
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* News List */}
      <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 custom-scrollbar">
        {news.map((item, index) => {
          const isExpanded = expandedItems.has(index);
          const shouldTruncate = item.cleanContent.length > 300;

          return (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-all"
            >
              {/* Time & Date */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{formatDate(item.pubDate)}</span>
                <span className="text-xs font-mono font-semibold text-purple-400">
                  {formatTime(item.pubDate)}
                </span>
              </div>

              {/* Content */}
              <div className="text-sm text-slate-200 leading-relaxed mb-3">
                {shouldTruncate && !isExpanded ? (
                  <>
                    {highlightHashtags(item.cleanContent.substring(0, 300) + '...')}
                  </>
                ) : (
                  highlightHashtags(item.cleanContent)
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  >
                    {isExpanded ? 'Свернуть' : 'Читать далее'}
                  </button>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 transition-colors ml-auto"
                  >
                    Источник
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default NewsFeed;
