// Simple API handler for news fetching
// This would normally be a backend endpoint, but for Vite we'll use a client-side approach

export interface NewsItem {
  title: string;
  content: string;
  pubDate: string;
  link: string;
  cleanContent: string;
  hashtags: string[];
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const RSS_URL = 'https://rsshub.app/telegram/channel/markettwits';

function cleanHtmlContent(html: string): string {
  // Remove HTML tags but preserve line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Remove excessive line breaks
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  return text;
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[A-Z0-9]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

export async function fetchMarketNews(): Promise<NewsItem[]> {
  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(RSS_URL)}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Parse XML manually (simple approach)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = xmlDoc.querySelectorAll('item');
    const newsItems: NewsItem[] = [];
    
    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const content = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      
      const cleanContent = cleanHtmlContent(content);
      const hashtags = extractHashtags(cleanContent);
      
      newsItems.push({
        title,
        content,
        pubDate,
        link,
        cleanContent,
        hashtags
      });
    });
    
    return newsItems.slice(0, 50); // Limit to 50 items
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Return mock data as fallback
    return getMockNews();
  }
}

function getMockNews(): NewsItem[] {
  return [
    {
      title: 'Рынок сегодня',
      content: 'Индекс Мосбиржи растет на 0.8% после открытия торгов. #IMOEX #MOEX',
      pubDate: new Date().toISOString(),
      link: 'https://t.me/markettwits',
      cleanContent: 'Индекс Мосбиржи растет на 0.8% после открытия торгов. #IMOEX #MOEX',
      hashtags: ['#IMOEX', '#MOEX']
    },
    {
      title: 'Газпром дивиденды',
      content: '#GAZP Совет директоров рекомендовал дивиденды в размере 12.5 руб на акцию. Доходность 6.8%.',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      link: 'https://t.me/markettwits',
      cleanContent: '#GAZP Совет директоров рекомендовал дивиденды в размере 12.5 руб на акцию. Доходность 6.8%.',
      hashtags: ['#GAZP']
    },
    {
      title: 'Лукойл отчетность',
      content: '#LKOH Лукойл опубликовал сильную отчетность за 4 квартал. EBITDA выросла на 15% г/г, превысив ожидания рынка.',
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      link: 'https://t.me/markettwits',
      cleanContent: '#LKOH Лукойл опубликовал сильную отчетность за 4 квартал. EBITDA выросла на 15% г/г, превысив ожидания рынка.',
      hashtags: ['#LKOH']
    },
    {
      title: 'ЦБ решение',
      content: 'ЦБ РФ сохранил ключевую ставку на уровне 16%. Инфляционные ожидания остаются повышенными.',
      pubDate: new Date(Date.now() - 10800000).toISOString(),
      link: 'https://t.me/markettwits',
      cleanContent: 'ЦБ РФ сохранил ключевую ставку на уровне 16%. Инфляционные ожидания остаются повышенными.',
      hashtags: []
    },
    {
      title: 'Сбербанк новости',
      content: '#SBER Сбербанк запустил новый сервис для инвесторов. Комиссии снижены на 30%.',
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      link: 'https://t.me/markettwits',
      cleanContent: '#SBER Сбербанк запустил новый сервис для инвесторов. Комиссии снижены на 30%.',
      hashtags: ['#SBER']
    }
  ];
}
