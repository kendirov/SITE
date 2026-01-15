// API for fetching and processing FORTS futures data

// Интерфейс для свечи
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Функция для получения истории свечей фьючерса
export async function fetchFuturesCandles(secId: string, interval: number = 10, days: number = 3): Promise<CandleData[]> {
  try {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days);
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];
    
    const url = `/iss/engines/futures/markets/forts/securities/${secId}/candles.json?iss.meta=off&interval=${interval}&from=${fromStr}&till=${toStr}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const candles = data.candles?.data || [];
    const columns = data.candles?.columns || [];
    
    // Создаем индекс для колонок
    const colIndex: { [key: string]: number } = {};
    columns.forEach((col: string, idx: number) => {
      colIndex[col] = idx;
    });
    
    // Преобразуем данные в CandleData с фильтрацией некорректных значений
    const candleData: CandleData[] = candles
      .filter((row: any[]) => row && Array.isArray(row) && row.length > 0)
      .map((row: any[]) => {
        try {
          const open = Number(row[colIndex['open']]) || 0;
          const high = Number(row[colIndex['high']]) || 0;
          const low = Number(row[colIndex['low']]) || 0;
          const close = Number(row[colIndex['close']]) || 0;
          const volume = Number(row[colIndex['volume']]) || 0;
          const time = row[colIndex['begin']] || '';
          
          // Фильтруем NaN и Infinity
          if (
            isNaN(open) || !isFinite(open) ||
            isNaN(high) || !isFinite(high) ||
            isNaN(low) || !isFinite(low) ||
            isNaN(close) || !isFinite(close) ||
            isNaN(volume) || !isFinite(volume)
          ) {
            return null;
          }
          
          return {
            time: time,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
          };
        } catch (err) {
          console.error('Error processing candle row:', err);
          return null;
        }
      })
      .filter((item: CandleData | null): item is CandleData => item !== null);
    
    return candleData;
  } catch (error) {
    console.error(`Failed to fetch candles for ${secId}:`, error);
    return [];
  }
}

export interface FuturesContract {
  secId: string;
  shortName: string;
  last: number;
  volume: number;
  assetCode: string;
  expiryDate: string;
  prevPrice: number;
}

export interface ProcessedAsset {
  assetCode: string;
  assetName: string;
  frontMonth: {
    secId: string;
    price: number;
    change: number;
    changePercent: number;
    expiryDate: string;
  };
  nextMonth: {
    secId: string;
    price: number;
    expiryDate: string;
  } | null;
  spread: number; // in %
  spreadAbsolute: number;
  termStructure: 'CONTANGO' | 'BACKWARDATION' | 'FLAT';
  totalVolume: number;
}

export interface FuturesTableRow {
  secId: string;
  shortName: string;
  assetCode: string;
  assetName: string;
  category: 'energy' | 'currency' | 'metals' | 'stocks' | 'indices' | 'other';
  price: number;
  changePercent: number;
  expiryDate: string;
  daysToExpiry: number;
  volume: number;
  openInterest: number;
  numTrades: number; // Количество сделок
  low: number; // Минимум дня
  high: number; // Максимум дня
  swapRate: number | null; // Своп для вечных фьючерсов
  initialMargin: number; // ГО (гарантийное обеспечение)
  termStructure: 'CONTANGO' | 'BACKWARDATION' | 'FLAT' | null;
  spread: number | null;
  isPerpetual: boolean; // Вечный фьючерс (заканчивается на 'F')
  isMain?: boolean; // Флаг "актуального" фьючерса (с максимальным объемом)
  voltoday?: number; // Объем в контрактах (VOLTODAY) для определения главного контракта
}

// Группа фьючерсов по базовому активу
export interface FuturesGroup {
  assetCode: string;
  assetName: string;
  category: 'energy' | 'currency' | 'metals' | 'stocks' | 'indices' | 'other';
  totalVolume: number; // Суммарный объем по группе (VALTODAY - объем в деньгах)
  totalMoneyVolume: number; // Суммарный оборот в рублях (VALTODAY - уже в деньгах)
  totalOI: number; // Суммарный открытый интерес по группе
  totalTrades: number; // Суммарное количество сделок по группе
  frontMonthPrice: number; // Цена ближайшего фьючерса
  frontMonthChangePercent: number; // Изменение % ближайшего фьючерса
  // Главный контракт (Representative Contract)
  mainContract: FuturesTableRow | null; // Контракт с максимальным объемом или ближайший по дате
  futures: FuturesTableRow[]; // Все фьючерсы в группе
}

// Словарь активов с лаконичными русскими названиями
// Маппинг ASSETCODE -> Название (без лишних слов)
export const ASSET_NAMES: { [key: string]: string } = {
  // Валюта
  'Si': 'Доллар США',
  'USD': 'Доллар США',
  'CR': 'Юань / Рубль',
  'CNY': 'Юань / Рубль',
  'Eu': 'Евро / Рубль',
  'EUR': 'Евро / Рубль',
  // Индексы
  'MIX': 'Индекс Мосбиржи',
  'MX': 'Индекс Мосбиржи',
  'RTS': 'Индекс РТС',
  'RI': 'Индекс РТС',
  // Энергетика
  'BR': 'Нефть Brent',
  'BRENT': 'Нефть Brent',
  'NG': 'Природный Газ',
  // Металлы
  'GOLD': 'Золото',
  'SILV': 'Серебро',
  'PALL': 'Палладий',
  'PLAT': 'Платина',
  // Акции
  'SBER': 'Сбербанк',
  'SBRF': 'Сбербанк',
  'GAZR': 'Газпром',
  'GZ': 'Газпром',
  'LKOH': 'Лукойл',
  'ROSN': 'Роснефть',
  'VTBR': 'ВТБ',
  'NVTK': 'Новатэк',
  'GMKN': 'Норникель',
  'GMKR': 'Норникель',
  'PLZL': 'Полюс',
  'MGNT': 'Магнит',
  'TATN': 'Татнефть',
  'ALRS': 'Алроса',
  'SNGS': 'Сургутнефтегаз',
  'MOEX': 'Мосбиржа',
  'YNDX': 'Яндекс',
  'AFLT': 'Аэрофлот',
  // Металлы и сырье
  'PD': 'Палладий',
  'PT': 'Платина',
  'AL': 'Алюминий',
  'ZN': 'Цинк',
  'NI': 'Никель',
  'CO': 'Медь',
  // Акции (дополнительные)
  'UC': 'Русал',
  'MAGN': 'ММК',
  'NLMK': 'НЛМК',
  'CHMF': 'Северсталь',
  'POLY': 'Полиметалл',
  'FEES': 'ФСК ЕЭС',
  'HYDR': 'РусГидро',
  'RTKM': 'Ростелеком',
  'MTSI': 'МТС',
  'AFKS': 'АФК Система',
  'PIKK': 'ПИК',
  'SMLT': 'Самолет',
  'TRNFP': 'Транснефть',
  // Сырье
  'WHEAT': 'Пшеница',
  'SUGAR': 'Сахар'
};

const ASSET_CATEGORIES: { [key: string]: 'energy' | 'currency' | 'metals' | 'stocks' | 'indices' | 'other' } = {
  // Энергетика
  'BR': 'energy',
  'BRENT': 'energy',
  'NG': 'energy',
  // Валюта
  'USD': 'currency',
  'EUR': 'currency',
  'CNY': 'currency',
  'Si': 'currency',
  'Eu': 'currency',
  'CR': 'currency',
  // Металлы
  'GOLD': 'metals',
  'GD': 'metals',
  'SILV': 'metals',
  'PALL': 'metals',
  'PLAT': 'metals',
  // Акции
  'GMKR': 'stocks',
  'LKOH': 'stocks',
  'ROSN': 'stocks',
  'GAZR': 'stocks',
  'GZ': 'stocks',
  'SBER': 'stocks',
  'SR': 'stocks',
  'SBRF': 'stocks',
  'VTBR': 'stocks',
  'AFLT': 'stocks',
  'MGNT': 'stocks',
  'YNDX': 'stocks',
  // Индексы
  'MIX': 'indices',
  'MX': 'indices',
  'RTS': 'indices',
  'RI': 'indices'
};

const CATEGORY_NAMES: { [key: string]: string } = {
  'energy': 'Энергетика',
  'currency': 'Валюта',
  'metals': 'Металлы',
  'stocks': 'Акции',
  'indices': 'Индексы',
  'other': 'Прочее'
};

const LIQUIDITY_THRESHOLD = 1_000_000; // 1M RUB (lowered for better visibility)

export async function fetchFuturesData(): Promise<ProcessedAsset[]> {
  try {
    const response = await fetch(
      '/iss/engines/futures/markets/forts/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME,LAST,VOLTODAY,ASSETCODE,LASTDELDATE,PREVPRICE'
    );

    if (!response.ok) {
      console.log('MOEX API response not OK:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const securities = data.securities.data;
    
    console.log('Total securities from MOEX:', securities.length);

    // Parse raw data
    const contracts: FuturesContract[] = securities
      .map((row: any[]) => {
        const [secId, shortName, last, volume, assetCode, expiryDate, prevPrice] = row;
        
        // Use LAST if available, otherwise PREVPRICE
        const price = (last && last > 0) ? last : (prevPrice || 0);
        
        return {
          secId: secId || '',
          shortName: shortName || '',
          last: price,
          volume: volume || 0,
          assetCode: assetCode || '',
          expiryDate: expiryDate || '',
          prevPrice: prevPrice || 0
        };
      })
      .filter((c: FuturesContract) => {
        // Filter criteria:
        // 1. Must have asset code
        // 2. Must have some price (LAST or PREVPRICE)
        // 3. Must have expiry date
        // 4. Must not be expired yet
        const hasAssetCode = c.assetCode && c.assetCode.length > 0;
        const hasPrice = c.last > 0;
        const hasExpiryDate = c.expiryDate && c.expiryDate.length > 0;
        const notExpired = hasExpiryDate && new Date(c.expiryDate) > new Date();
        
        return hasAssetCode && hasPrice && hasExpiryDate && notExpired;
      });
      
    console.log('Filtered contracts:', contracts.length);

    // Group by asset code
    const grouped = groupByAsset(contracts);
    console.log('Asset groups:', grouped.size);
    
    // Process each group
    const processed = processGroups(grouped);
    console.log('Processed assets:', processed.length);
    
    // Sort by liquidity (descending)
    processed.sort((a, b) => b.totalVolume - a.totalVolume);
    
    // If no data, return mock
    if (processed.length === 0) {
      console.log('No processed data, returning mock');
      return getMockFuturesData();
    }
    
    return processed;
  } catch (error) {
    console.error('Failed to fetch futures data:', error);
    return getMockFuturesData();
  }
}

function groupByAsset(contracts: FuturesContract[]): Map<string, FuturesContract[]> {
  const groups = new Map<string, FuturesContract[]>();
  
  contracts.forEach(contract => {
    if (!groups.has(contract.assetCode)) {
      groups.set(contract.assetCode, []);
    }
    groups.get(contract.assetCode)!.push(contract);
  });
  
  return groups;
}

function processGroups(groups: Map<string, FuturesContract[]>): ProcessedAsset[] {
  const result: ProcessedAsset[] = [];
  
  groups.forEach((contracts, assetCode) => {
    // Calculate total volume
    const totalVolume = contracts.reduce((sum, c) => sum + c.volume, 0);
    
    // Filter out low liquidity assets
    if (totalVolume < LIQUIDITY_THRESHOLD) {
      return;
    }
    
    // Sort by expiry date
    const sorted = contracts.sort((a, b) => 
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    
    if (sorted.length === 0) return;
    
    // Find Front Month (nearest expiry with highest volume)
    const frontMonth = sorted[0];
    
    // Find Next Month (next expiry)
    const nextMonth = sorted.length > 1 ? sorted[1] : null;
    
    // Calculate spread
    let spread = 0;
    let spreadAbsolute = 0;
    let termStructure: 'CONTANGO' | 'BACKWARDATION' | 'FLAT' = 'FLAT';
    
    if (nextMonth) {
      spreadAbsolute = nextMonth.last - frontMonth.last;
      spread = (spreadAbsolute / frontMonth.last) * 100;
      
      if (spread > 0.5) {
        termStructure = 'CONTANGO';
      } else if (spread < -0.5) {
        termStructure = 'BACKWARDATION';
      }
    }
    
    // Calculate change
    const change = frontMonth.last - frontMonth.prevPrice;
    const changePercent = frontMonth.prevPrice > 0 
      ? (change / frontMonth.prevPrice) * 100 
      : 0;
    
    result.push({
      assetCode,
      assetName: ASSET_NAMES[assetCode] || assetCode,
      frontMonth: {
        secId: frontMonth.secId,
        price: frontMonth.last,
        change,
        changePercent,
        expiryDate: frontMonth.expiryDate
      },
      nextMonth: nextMonth ? {
        secId: nextMonth.secId,
        price: nextMonth.last,
        expiryDate: nextMonth.expiryDate
      } : null,
      spread,
      spreadAbsolute,
      termStructure,
      totalVolume
    });
  });
  
  return result;
}

function getMockFuturesData(): ProcessedAsset[] {
  return [
    {
      assetCode: 'BR',
      assetName: 'Нефть Brent',
      frontMonth: {
        secId: 'BRF6',
        price: 85.40,
        change: 1.20,
        changePercent: 1.43,
        expiryDate: '2026-02-15'
      },
      nextMonth: {
        secId: 'BRG6',
        price: 84.20,
        expiryDate: '2026-03-15'
      },
      spread: -1.41,
      spreadAbsolute: -1.20,
      termStructure: 'BACKWARDATION',
      totalVolume: 450_000_000
    },
    {
      assetCode: 'Si',
      assetName: 'Доллар США',
      frontMonth: {
        secId: 'SiF6',
        price: 92.50,
        change: -0.30,
        changePercent: -0.32,
        expiryDate: '2026-02-20'
      },
      nextMonth: {
        secId: 'SiG6',
        price: 93.20,
        expiryDate: '2026-03-20'
      },
      spread: 0.76,
      spreadAbsolute: 0.70,
      termStructure: 'CONTANGO',
      totalVolume: 380_000_000
    },
    {
      assetCode: 'GOLD',
      assetName: 'Золото',
      frontMonth: {
        secId: 'GOLDF6',
        price: 2050.00,
        change: 15.50,
        changePercent: 0.76,
        expiryDate: '2026-02-18'
      },
      nextMonth: {
        secId: 'GOLDG6',
        price: 2055.00,
        expiryDate: '2026-03-18'
      },
      spread: 0.24,
      spreadAbsolute: 5.00,
      termStructure: 'FLAT',
      totalVolume: 120_000_000
    },
    {
      assetCode: 'GZ',
      assetName: 'Газпром',
      frontMonth: {
        secId: 'GZF6',
        price: 180.50,
        change: -2.30,
        changePercent: -1.26,
        expiryDate: '2026-02-15'
      },
      nextMonth: {
        secId: 'GZG6',
        price: 181.80,
        expiryDate: '2026-03-15'
      },
      spread: 0.72,
      spreadAbsolute: 1.30,
      termStructure: 'CONTANGO',
      totalVolume: 95_000_000
    }
  ];
}

// New function to fetch ALL futures contracts for the table
// Uses MOEX ISS API to get real-time futures data with pagination
export async function fetchAllFuturesContracts(): Promise<FuturesTableRow[]> {
  try {
    const baseUrl = '/iss/engines/futures/markets/forts/securities.json';
    const params = 'iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,ASSETCODE,LASTDELDATE,PREVPRICE,INITIALMARGIN&marketdata.columns=SECID,LAST,VALTODAY,VOLTODAY,OPENPOSITION,OPENPOSITIONVALUE,CHANGE,LASTTOPREVPRICE,NUMTRADES,LOW,HIGH,SWAPRATE';
    
    // Собираем все данные через пагинацию
    let allSecuritiesData: any[][] = [];
    let allMarketdataData: any[][] = [];
    let securitiesColumns: string[] = [];
    let marketdataColumns: string[] = [];
    let start = 0;
    const limit = 100; // MOEX API возвращает по 100 записей по умолчанию
    
    // Циклическая загрузка всех страниц
    let hasMoreData = true;
    let pageCount = 0;
    const maxPages = 20; // Защита от бесконечного цикла (максимум 2000 контрактов)
    
    while (hasMoreData && pageCount < maxPages) {
      const url = `${baseUrl}?${params}&securities.start=${start}&marketdata.start=${start}`;
      const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
      
      // Получаем колонки только при первой итерации
      if (start === 0) {
        securitiesColumns = data.securities.columns || [];
        marketdataColumns = data.marketdata?.columns || [];
      }
      
      const securitiesData = data.securities.data || [];
      const marketdataData = data.marketdata?.data || [];
      
      // Если данных нет, прекращаем загрузку
      if (securitiesData.length === 0) {
        hasMoreData = false;
        break;
      }
      
      // Добавляем данные в общий массив
      allSecuritiesData = allSecuritiesData.concat(securitiesData);
      allMarketdataData = allMarketdataData.concat(marketdataData);
      
      // Если получили меньше limit записей, значит это последняя страница
      if (securitiesData.length < limit) {
        hasMoreData = false;
        break;
      }
      
      // Переходим к следующей странице
      start += limit;
      pageCount++;
    }
    
    if (pageCount >= maxPages) {
      console.warn(`Reached maximum page limit (${maxPages}). Some contracts may be missing.`);
    }
    
    console.log(`Loaded ${allSecuritiesData.length} futures contracts from MOEX API`);
    
    // Удаляем дубликаты по SECID (могут появиться из-за пагинации)
    const uniqueSecuritiesMap = new Map<string, any[]>();
    const uniqueMarketdataMap = new Map<string, any[]>();
    
    // Создаем индекс для SECID в колонках
    const secIdIndex = securitiesColumns.indexOf('SECID');
    const mktSecIdIndex = marketdataColumns.indexOf('SECID');
    
    // Фильтруем дубликаты в securities
    allSecuritiesData.forEach(row => {
      if (secIdIndex !== -1 && row[secIdIndex]) {
        const secId = row[secIdIndex];
        if (!uniqueSecuritiesMap.has(secId)) {
          uniqueSecuritiesMap.set(secId, row);
        }
      }
    });
    
    // Фильтруем дубликаты в marketdata
    allMarketdataData.forEach(row => {
      if (mktSecIdIndex !== -1 && row[mktSecIdIndex]) {
        const secId = row[mktSecIdIndex];
        if (!uniqueMarketdataMap.has(secId)) {
          uniqueMarketdataMap.set(secId, row);
        }
      }
    });
    
    console.log(`After deduplication: ${uniqueSecuritiesMap.size} unique contracts`);
    
    // Get columns and data arrays (без дубликатов)
    const securitiesData = Array.from(uniqueSecuritiesMap.values());
    const marketdataData = Array.from(uniqueMarketdataMap.values());
    
    // Create index maps for column names
    const secColIndex: { [key: string]: number } = {};
    securitiesColumns.forEach((col: string, idx: number) => {
      secColIndex[col] = idx;
    });
    
    const mktColIndex: { [key: string]: number } = {};
    marketdataColumns.forEach((col: string, idx: number) => {
      mktColIndex[col] = idx;
    });
    
    // Create a map for quick lookup of market data by SECID
    const marketdataMap = new Map<string, { [key: string]: any }>();
    marketdataData.forEach((row: any[]) => {
      const secIdIdx = mktColIndex['SECID'];
      if (secIdIdx !== undefined && row[secIdIdx]) {
        const secId = row[secIdIdx];
        // ИСПРАВЛЕНИЕ: Используем VALTODAY (объем в деньгах) вместо VOLTODAY
        marketdataMap.set(secId, {
          'LAST': mktColIndex['LAST'] !== undefined ? row[mktColIndex['LAST']] : null,
          'VALTODAY': mktColIndex['VALTODAY'] !== undefined ? row[mktColIndex['VALTODAY']] : null,
          'VOLTODAY': mktColIndex['VOLTODAY'] !== undefined ? row[mktColIndex['VOLTODAY']] : null,
          'OPENPOSITION': mktColIndex['OPENPOSITION'] !== undefined ? row[mktColIndex['OPENPOSITION']] : null,
          'OPENPOSITIONVALUE': mktColIndex['OPENPOSITIONVALUE'] !== undefined ? row[mktColIndex['OPENPOSITIONVALUE']] : null,
          'CHANGE': mktColIndex['CHANGE'] !== undefined ? row[mktColIndex['CHANGE']] : null,
          'LASTTOPREVPRICE': mktColIndex['LASTTOPREVPRICE'] !== undefined ? row[mktColIndex['LASTTOPREVPRICE']] : null,
          'NUMTRADES': mktColIndex['NUMTRADES'] !== undefined ? row[mktColIndex['NUMTRADES']] : null,
          'LOW': mktColIndex['LOW'] !== undefined ? row[mktColIndex['LOW']] : null,
          'HIGH': mktColIndex['HIGH'] !== undefined ? row[mktColIndex['HIGH']] : null,
          'SWAPRATE': mktColIndex['SWAPRATE'] !== undefined ? row[mktColIndex['SWAPRATE']] : null
        });
      }
    });
    
    const today = new Date();
    
    // Process securities data and merge with marketdata
    const allContracts: FuturesTableRow[] = securitiesData
      .map((row: any[]) => {
        const secId = (secColIndex['SECID'] !== undefined && row[secColIndex['SECID']]) ? row[secColIndex['SECID']] : '';
        const shortName = (secColIndex['SHORTNAME'] !== undefined && row[secColIndex['SHORTNAME']]) ? row[secColIndex['SHORTNAME']] : '';
        const assetCode = (secColIndex['ASSETCODE'] !== undefined && row[secColIndex['ASSETCODE']]) ? row[secColIndex['ASSETCODE']] : '';
        const expiryDate = (secColIndex['LASTDELDATE'] !== undefined && row[secColIndex['LASTDELDATE']]) ? row[secColIndex['LASTDELDATE']] : '';
        const prevPrice = (secColIndex['PREVPRICE'] !== undefined && row[secColIndex['PREVPRICE']]) ? row[secColIndex['PREVPRICE']] : 0;
        const initialMargin = (secColIndex['INITIALMARGIN'] !== undefined && row[secColIndex['INITIALMARGIN']]) ? row[secColIndex['INITIALMARGIN']] : 0;
        
        // Get market data for this security
        const market = marketdataMap.get(secId) || {};
        
        // Use LAST price if available, otherwise fallback to PREVPRICE
        const price = (market['LAST'] && market['LAST'] > 0) ? market['LAST'] : (prevPrice || 0);
        
        // Calculate change percentage
        // Prefer LASTTOPREVPRICE (percentage change) if available, otherwise calculate from CHANGE or price difference
        let changePercent = 0;
        if (market['LASTTOPREVPRICE'] !== null && market['LASTTOPREVPRICE'] !== undefined) {
          changePercent = market['LASTTOPREVPRICE'];
        } else if (market['CHANGE'] !== null && market['CHANGE'] !== undefined && prevPrice > 0) {
          changePercent = (market['CHANGE'] / prevPrice) * 100;
        } else if (prevPrice > 0) {
          changePercent = ((price - prevPrice) / prevPrice) * 100;
        }
        
        // Calculate days to expiry
        const expiry = new Date(expiryDate);
        const daysToExpiry = Math.max(0, Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Проверяем, является ли фьючерс вечным (заканчивается на 'F')
        const isPerpetual = secId.endsWith('F');
        
        // ИСПРАВЛЕНИЕ: Используем VALTODAY (объем в деньгах) вместо VOLTODAY
        // VALTODAY может быть null или undefined, обрабатываем это
        const valToday = (market['VALTODAY'] !== null && market['VALTODAY'] !== undefined) ? market['VALTODAY'] : 0;
        const voltoday = (market['VOLTODAY'] !== null && market['VOLTODAY'] !== undefined) ? market['VOLTODAY'] : 0;
        const openPosition = (market['OPENPOSITION'] !== null && market['OPENPOSITION'] !== undefined) ? market['OPENPOSITION'] : 0;
        const numTrades = (market['NUMTRADES'] !== null && market['NUMTRADES'] !== undefined) ? market['NUMTRADES'] : 0;
        
        return {
          secId,
          shortName,
          assetCode,
          assetName: ASSET_NAMES[assetCode] || assetCode,
          category: ASSET_CATEGORIES[assetCode] || 'other',
          price,
          changePercent,
          expiryDate,
          daysToExpiry,
          volume: valToday, // VALTODAY - объем в деньгах (рублях)
          openInterest: openPosition, // OPENPOSITION - количество контрактов
          numTrades: numTrades, // NUMTRADES - количество сделок
          low: (market['LOW'] && market['LOW'] > 0) ? market['LOW'] : price,
          high: (market['HIGH'] && market['HIGH'] > 0) ? market['HIGH'] : price,
          swapRate: (market['SWAPRATE'] !== null && market['SWAPRATE'] !== undefined) ? market['SWAPRATE'] : null,
          initialMargin: initialMargin || 0,
          termStructure: null,
          spread: null,
          isPerpetual,
          voltoday: voltoday > 0 ? voltoday : undefined
        };
      })
      .filter((row: FuturesTableRow) => {
        // Фильтрация: исключаем только действительно мертвые контракты
        // 1. Должен быть asset code
        if (!row.assetCode || row.assetCode.length === 0) {
          return false;
        }
        
        // 2. Для вечных фьючерсов проверяем только наличие цены
        if (row.isPerpetual) {
          return row.price > 0;
        }
        
        // 3. Для срочных контрактов: исключаем только прошедшие даты экспирации
        // Если дата экспирации прошла (daysToExpiry < 0), исключаем
        if (row.expiryDate && row.daysToExpiry < 0) {
          return false;
        }
        
        // 4. Если нет даты экспирации и это не вечный - исключаем
        if (!row.expiryDate || row.expiryDate.length === 0) {
          return false;
        }
        
        // 5. Оставляем контракты, которые еще не истекли
        // (даже если объем = 0 или цена = 0, но контракт еще активен)
        // Главное - дата экспирации не прошла
        return row.daysToExpiry >= 0;
      });
    
    // Calculate term structure for each contract by comparing with next contract of the same asset
    const grouped = new Map<string, FuturesTableRow[]>();
    allContracts.forEach(contract => {
      if (!grouped.has(contract.assetCode)) {
        grouped.set(contract.assetCode, []);
      }
      grouped.get(contract.assetCode)!.push(contract);
    });
    
    grouped.forEach(contracts => {
      // Sort by expiry date (nearest first)
      contracts.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      
      // Calculate spread and term structure for each contract
      for (let i = 0; i < contracts.length; i++) {
        if (i < contracts.length - 1) {
          const current = contracts[i];
          const next = contracts[i + 1];
          const spread = ((next.price - current.price) / current.price) * 100;
          
          current.spread = spread;
          if (spread > 0.5) {
            current.termStructure = 'CONTANGO';
          } else if (spread < -0.5) {
            current.termStructure = 'BACKWARDATION';
          } else {
            current.termStructure = 'FLAT';
          }
        }
      }
    });
    
    // Sort by volume (descending) - most liquid contracts first
    allContracts.sort((a, b) => b.volume - a.volume);
    
    return allContracts;
  } catch (error) {
    console.error('Failed to fetch all futures contracts:', error);
    // Return empty array on error instead of mock data
    return [];
  }
}

// Функция для извлечения базового названия из SHORTNAME (обрезает дату)
function extractBaseNameFromShortName(shortName: string): string {
  if (!shortName) return '';
  // Убираем даты в формате "Название-ММ.ГГ" или "Название ММ.ГГ"
  // Примеры: "Газпром-03.25" -> "Газпром", "Сбер-06.25" -> "Сбер"
  const match = shortName.match(/^([^-0-9]+)/);
  return match ? match[1].trim() : shortName;
}

// Группирует фьючерсы по базовому активу
export function groupFuturesByAsset(contracts: FuturesTableRow[]): FuturesGroup[] {
  // Группируем строго по ASSETCODE из API
  const groupsMap = new Map<string, FuturesTableRow[]>();
  
  contracts.forEach(contract => {
    // Используем ASSETCODE из API
    let assetCode = contract.assetCode;
    
    // Если ASSETCODE пустой, используем SHORTNAME (обрезав дату)
    if (!assetCode || assetCode.length === 0) {
      const baseName = extractBaseNameFromShortName(contract.shortName);
      assetCode = baseName || contract.secId; // Fallback на secId если ничего не найдено
    }
    
    // Нормализуем assetCode (приводим к верхнему регистру для консистентности)
    assetCode = assetCode.toUpperCase();
    
    if (!groupsMap.has(assetCode)) {
      groupsMap.set(assetCode, []);
    }
    groupsMap.get(assetCode)!.push(contract);
  });
  
  // Преобразуем в массив групп
  const groups: FuturesGroup[] = [];
  
  groupsMap.forEach((futures, assetCode) => {
    // Считаем суммарные значения ДО фильтрации
    // ИСПРАВЛЕНИЕ: volume теперь это VALTODAY (объем в деньгах)
    // Исключаем null/undefined, считаем их за 0
    const totalVolume = futures.reduce((sum, f) => {
      const vol = (f.volume !== null && f.volume !== undefined) ? f.volume : 0;
      return sum + vol;
    }, 0);
    
    // НЕ фильтруем группы по объему здесь - фильтрация будет в компоненте
    // в зависимости от режима сортировки
    
    // Находим front-month (ближайший срочной контракт с объемом > 0)
    const frontMonth = futures
      .filter(f => {
        if (f.isPerpetual || !f.expiryDate) return false;
        const vol = (f.volume !== null && f.volume !== undefined) ? f.volume : 0;
        return vol > 0;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0] || 
      futures.find(f => !f.isPerpetual && f.expiryDate);
    
    const frontMonthSecId = frontMonth?.secId || null;
    
    // ФИЛЬТРАЦИЯ СТРОК внутри группы:
    // Показываем фьючерс только если:
    // а) У него есть объем торгов (VALTODAY > 0)
    // ИЛИ б) Это вечный фьючерс (тикер заканчивается на 'F')
    // ИЛИ в) Это ближайший по дате экспирации контракт (Front month)
    const filteredFutures = futures.filter(f => {
      // Вечные фьючерсы всегда показываем
      if (f.isPerpetual) {
        return true;
      }
      
      // Front month всегда показываем
      if (f.secId === frontMonthSecId) {
        return true;
      }
      
      // Остальные - только с объемом > 0 (VALTODAY)
      const vol = (f.volume !== null && f.volume !== undefined) ? f.volume : 0;
      return vol > 0;
    });
    
    // Если после фильтрации не осталось фьючерсов, пропускаем группу
    if (filteredFutures.length === 0) {
      return;
    }
    
    // УМНАЯ СОРТИРОВКА внутри группы:
    // 1. Вечные фьючерсы (всегда сверху)
    // 2. Ближайший срочной контракт (по дате экспирации)
    // 3. Следующий срочной контракт
    // 4. Мини-контракты (если они попали в эту группу)
    const sortedFutures = [...filteredFutures].sort((a, b) => {
      // Приоритет 1: Вечные фьючерсы всегда первыми
      if (a.isPerpetual && !b.isPerpetual) return -1;
      if (!a.isPerpetual && b.isPerpetual) return 1;
      
      // Приоритет 2: Front month идет вторым (после вечных)
      if (a.secId === frontMonthSecId && b.secId !== frontMonthSecId) return -1;
      if (a.secId !== frontMonthSecId && b.secId === frontMonthSecId) return 1;
      
      // Приоритет 3: Для срочных - по дате экспирации (ближайший первый)
      if (!a.isPerpetual && !b.isPerpetual && a.expiryDate && b.expiryDate) {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      
      // Приоритет 4: Мини-контракты идут после обычных
      const aIsMini = a.shortName?.toLowerCase().includes('mini') || 
                      a.secId.toLowerCase().includes('mini');
      const bIsMini = b.shortName?.toLowerCase().includes('mini') || 
                      b.secId.toLowerCase().includes('mini');
      if (!aIsMini && bIsMini) return -1;
      if (aIsMini && !bIsMini) return 1;
      
      // Для вечных используем secId для сортировки
      if (a.isPerpetual && b.isPerpetual) {
        return a.secId.localeCompare(b.secId);
      }
      
      return 0;
    });
    
    // Пересчитываем суммарные значения после фильтрации
    // ИСПРАВЛЕНИЕ: Исключаем null/undefined, считаем их за 0
    const totalOI = filteredFutures.reduce((sum, f) => {
      const oi = (f.openInterest !== null && f.openInterest !== undefined) ? f.openInterest : 0;
      return sum + oi;
    }, 0);
    
    const totalTrades = filteredFutures.reduce((sum, f) => {
      const trades = (f.numTrades !== null && f.numTrades !== undefined) ? f.numTrades : 0;
      return sum + trades;
    }, 0);
    
    // ИСПРАВЛЕНИЕ: totalMoneyVolume теперь просто сумма VALTODAY (уже в деньгах)
    const totalMoneyVolume = filteredFutures.reduce((sum, f) => {
      const vol = (f.volume !== null && f.volume !== undefined) ? f.volume : 0;
      return sum + vol;
    }, 0);
    
    // Находим ГЛАВНЫЙ КОНТРАКТ (Representative Contract):
    // ИСПРАВЛЕНИЕ: Используем VOLTODAY (объем в контрактах) для определения главного контракта
    // 1. Контракт с максимальным VOLTODAY (объем в контрактах) или OPENPOSITION
    // 2. Если объемов нет, берем ближайший по дате экспирации, который еще не истек
    let mainContract: FuturesTableRow | null = null;
    
    // Сначала ищем по максимальному VOLTODAY (объем в контрактах) или OPENPOSITION
    const contractsWithVolume = filteredFutures
      .map(f => ({
        contract: f,
        // Приоритет: VOLTODAY > OPENPOSITION > VALTODAY
        volumeScore: (f.voltoday && f.voltoday > 0) ? f.voltoday : 
                     ((f.openInterest && f.openInterest > 0) ? f.openInterest : 
                      ((f.volume !== null && f.volume !== undefined) ? f.volume : 0))
      }))
      .filter(f => f.volumeScore > 0)
      .sort((a, b) => b.volumeScore - a.volumeScore);
    
    if (contractsWithVolume.length > 0) {
      mainContract = contractsWithVolume[0].contract;
    } else {
      // Если нет контрактов с объемом, берем ближайший по дате экспирации
      const today = new Date();
      const validContracts = filteredFutures
        .filter(f => {
          if (!f.expiryDate) return false;
          const expiryDate = new Date(f.expiryDate);
          return expiryDate >= today;
        })
        .sort((a, b) => {
          if (!a.expiryDate || !b.expiryDate) return 0;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
      
      if (validContracts.length > 0) {
        mainContract = validContracts[0];
      } else if (filteredFutures.length > 0) {
        // Fallback: берем первый доступный контракт
        mainContract = filteredFutures[0];
      }
    }
    
    // Помечаем главный контракт флагом isMain
    const finalSortedFutures = sortedFutures.map(f => {
      if (mainContract && f.secId === mainContract.secId) {
        return { ...f, isMain: true };
      }
      return { ...f, isMain: false };
    });
    
    // Сортируем: главный контракт всегда первый в группе
    finalSortedFutures.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return 0; // Сохраняем остальную сортировку
    });
    
    // Получаем название группы
    let assetName = ASSET_NAMES[assetCode];
    if (!assetName) {
      // Если нет в словаре, используем SHORTNAME первого фьючерса (обрезав дату)
      const firstFuture = finalSortedFutures[0];
      if (firstFuture && firstFuture.shortName) {
        assetName = extractBaseNameFromShortName(firstFuture.shortName);
      } else {
        assetName = assetCode;
      }
    }
    
    groups.push({
      assetCode,
      assetName,
      category: ASSET_CATEGORIES[assetCode] || 'other',
      totalVolume,
      totalMoneyVolume,
      totalOI,
      totalTrades,
      frontMonthPrice: frontMonth?.price || 0,
      frontMonthChangePercent: frontMonth?.changePercent || 0,
      mainContract,
      futures: finalSortedFutures
    });
  });
  
  // Сортировка по умолчанию - по суммарному обороту в рублях (по убыванию)
  // Это будет переопределено в компоненте, но оставляем для совместимости
  groups.sort((a, b) => b.totalMoneyVolume - a.totalMoneyVolume);
  
  return groups;
}

export { CATEGORY_NAMES };
