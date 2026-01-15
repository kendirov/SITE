import React, { useState, useEffect } from 'react';
import { Newspaper, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import EconomicCalendar from '../components/EconomicCalendar';
import NewsFeed from '../components/NewsFeed';

const NewsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Newspaper className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Новости и События</h1>
            <p className="text-slate-400">Live Market Feed • Economic Calendar</p>
          </div>
        </div>
      </div>

      {/* Grid Layout: 30% Calendar / 70% News */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Economic Calendar (30%) */}
        <div className="lg:col-span-4">
          <EconomicCalendar />
        </div>

        {/* Right Column: News Feed (70%) */}
        <div className="lg:col-span-8">
          <NewsFeed />
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
