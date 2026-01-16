// API for fetching and processing stocks data from MOEX TQBR market

// Interfaces for stock specifications
export interface StockSpecification {
  secId: string;
  shortName: string;
  lotSize: number;
  minStep: number;
  last: number;
  prevPrice: number;
  valToday: number; // Оборот сегодня
  prevValue: number; // Вчерашний оборот (PREVVALUE)
}

export interface ProcessedStockSpec {
  secId: string;
  shortName: string;
  lotSize: number;
  minStep: number;
  last: number;
  costOfStep: number; // MINSTEP * LOTSIZE
  commission: number; // LAST * LOTSIZE * COMMISSION_RATE
  valToday: number; // Оборот сегодня
  largeLot1Pct: number; // (PREVVALUE * 0.01) / (LAST * LOTSIZE) - округлено до целого, использует вчерашний оборот
}

export const COMMISSION_RATE = 0.0004; // 0.04% - усредненная комиссия пропов

// Function to fetch stocks specifications
export async function fetchStocksSpecifications(): Promise<ProcessedStockSpec[]> {
  try {
    const response = await fetch(
      'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,MINSTEP,PREVPRICE&marketdata.columns=SECID,LAST,VALTODAY,PREVVALUE'
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const securities = data.securities.data || [];
    const marketdata = data.marketdata?.data || [];

    // Create a map for quick lookup of market data
    const marketdataMap = new Map<string, { last: number; valToday: number; prevValue: number }>();
    const secColumns: string[] = data.securities.columns || [];
    const mdColumns: string[] = data.marketdata?.columns || [];

    marketdata.forEach((row: any[]) => {
      const md: any = {};
      mdColumns.forEach((col, idx) => {
        md[col] = row[idx];
      });
      const secId = md.SECID as string;
      if (secId) {
        marketdataMap.set(secId, {
          last: md.LAST || 0,
          valToday: md.VALTODAY || 0,
          prevValue: md.PREVVALUE || 0
        });
      }
    });

    // Parse securities
    const stocks: StockSpecification[] = securities.map((row: any[]) => {
      const sec: any = {};
      secColumns.forEach((col, idx) => {
        sec[col] = row[idx];
      });

      const secId = sec.SECID as string;
      const market = marketdataMap.get(secId) || { last: 0, valToday: 0, prevValue: 0 };

      return {
        secId: secId || '',
        shortName: sec.SHORTNAME || '',
        lotSize: sec.LOTSIZE || 1,
        minStep: sec.MINSTEP || 0,
        last: market.last || sec.PREVPRICE || 0,
        prevPrice: sec.PREVPRICE || 0,
        valToday: market.valToday || 0,
        prevValue: market.prevValue || 0
      };
    }).filter((stock: StockSpecification) => {
      // Фильтруем только те акции, у которых есть базовая информация
      return stock.secId && stock.lotSize > 0 && stock.minStep > 0 && stock.last > 0;
    });

    // Process stocks with calculations
    const processed: ProcessedStockSpec[] = stocks.map((stock) => {
      const costOfStep = stock.minStep * stock.lotSize;
      const commission = stock.last * stock.lotSize * COMMISSION_RATE;
      
      // LargeLot1Pct: (PREVVALUE * 0.01) / (LAST * LOTSIZE)
      // Используем PREVVALUE (вчерашний оборот), если нет - используем VALTODAY как запасной вариант
      const turnover = stock.prevValue > 0 ? stock.prevValue : stock.valToday;
      const largeLot1Pct = stock.last > 0 && stock.lotSize > 0
        ? Math.round((turnover * 0.01) / (stock.last * stock.lotSize))
        : 0;

      return {
        secId: stock.secId,
        shortName: stock.shortName,
        lotSize: stock.lotSize,
        minStep: stock.minStep,
        last: stock.last,
        costOfStep,
        commission,
        valToday: stock.valToday,
        largeLot1Pct
      };
    });

    // Сортируем по обороту (от большего к меньшему)
    return processed.sort((a, b) => b.valToday - a.valToday);
  } catch (error) {
    console.error('Failed to fetch stocks specifications:', error);
    throw error;
  }
}

export interface StockTableRow {
  secId: string;
  shortName: string;
  secName: string; // Полное название компании
  price: number;
  changePercent: number;
  volume: number; // Объем в рублях (VALTODAY)
  numTrades: number; // Количество сделок
  lotSize: number; // Размер лота
  tradingStatus: string; // Статус торгов
  prevPrice: number; // Предыдущая цена
  high: number; // Максимум дня
  low: number; // Минимум дня
  isIndex?: boolean; // Флаг для индекса IMOEX
  issueSize?: number; // Количество выпущенных акций (ISSUESIZE)
  voltoday?: number; // Объем в штуках (VOLTODAY)
  turnover?: number; // Оборот (VOLTODAY / ISSUESIZE * 100)
}

// Интерфейс для свечи акции
export interface StockCandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Функция для получения истории свечей акции
export async function fetchStockCandles(secId: string, interval: number = 10, days: number = 3): Promise<StockCandleData[]> {
  try {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days);
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];
    
    // ИСПРАВЛЕНИЕ: Правильный endpoint для акций
    const url = `/iss/engines/stock/markets/shares/securities/${secId}/candles.json?iss.meta=off&interval=${interval}&from=${fromStr}&till=${toStr}`;
    
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
    
    // Преобразуем данные в StockCandleData с фильтрацией некорректных значений
    const candleData: StockCandleData[] = candles
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
      .filter((item: StockCandleData | null): item is StockCandleData => item !== null);
    
    return candleData;
  } catch (error) {
    console.error(`Failed to fetch candles for ${secId}:`, error);
    return [];
  }
}

// Функция для получения индекса IMOEX2 (с учетом вечерней сессии)
export async function fetchIMOEXIndex(): Promise<StockTableRow | null> {
  try {
    // Endpoint для индекса Мосбиржи IMOEX2 (учитывает вечернюю сессию)
    const url = '/iss/engines/stock/markets/index/boards/SNDX/securities/IMOEX2.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,SECNAME&marketdata.columns=SECID,LAST,CURRENTVALUE,VALTODAY,NUMTRADES,LASTTOPREVPRICE,HIGH,LOW,PREVPRICE';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const securities = data.securities?.data?.[0] || [];
    const marketdata = data.marketdata?.data?.[0] || [];
    const securitiesColumns = data.securities?.columns || [];
    const marketdataColumns = data.marketdata?.columns || [];
    
    const secColIndex: { [key: string]: number } = {};
    securitiesColumns.forEach((col: string, idx: number) => {
      secColIndex[col] = idx;
    });
    
    const mktColIndex: { [key: string]: number } = {};
    marketdataColumns.forEach((col: string, idx: number) => {
      mktColIndex[col] = idx;
    });
    
    const secId = securities[secColIndex['SECID']] || 'IMOEX2';
    const shortName = securities[secColIndex['SHORTNAME']] || 'Индекс Мосбиржи';
    const secName = securities[secColIndex['SECNAME']] || 'Индекс Мосбиржи';
    
    // ИСПРАВЛЕНИЕ: Для индексов используем CURRENTVALUE вместо LAST
    const currentValue = marketdata[mktColIndex['CURRENTVALUE']] || 0;
    const lastValue = marketdata[mktColIndex['LAST']] || 0;
    const price = (currentValue > 0) ? currentValue : ((lastValue > 0) ? lastValue : 0);
    const prevPrice = (marketdata[mktColIndex['PREVPRICE']] && marketdata[mktColIndex['PREVPRICE']] > 0) ? marketdata[mktColIndex['PREVPRICE']] : price;
    const changePercent = marketdata[mktColIndex['LASTTOPREVPRICE']] || 0;
    const volume = marketdata[mktColIndex['VALTODAY']] || 0;
    const numTrades = marketdata[mktColIndex['NUMTRADES']] || 0;
    const high = (marketdata[mktColIndex['HIGH']] && marketdata[mktColIndex['HIGH']] > 0) ? marketdata[mktColIndex['HIGH']] : price;
    const low = (marketdata[mktColIndex['LOW']] && marketdata[mktColIndex['LOW']] > 0) ? marketdata[mktColIndex['LOW']] : price;
    
    return {
      secId,
      shortName: 'Весь Рынок (IMOEX2)',
      secName,
      price,
      changePercent,
      volume,
      numTrades,
      lotSize: 1,
      tradingStatus: 'T',
      prevPrice,
      high,
      low,
      isIndex: true
    };
  } catch (error) {
    console.error('Failed to fetch IMOEX2 index:', error);
    return null;
  }
}

// Функция для получения всех акций с пагинацией
// Возвращает объект с данными акций и временем обновления
export interface FetchAllStocksResult {
  stocks: StockTableRow[];
  updateTime: string | null; // Время обновления данных от биржи (UPDATETIME)
}

export async function fetchAllStocks(): Promise<FetchAllStocksResult> {
  try {
    const baseUrl = '/iss/engines/stock/markets/shares/boards/TQBR/securities.json';
    const params = 'iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,SECNAME,LOTSIZE,ISSUESIZE&marketdata.columns=SECID,LAST,VALTODAY,VOLTODAY,NUMTRADES,LASTTOPREVPRICE,TRADINGSTATUS,PREVPRICE,HIGH,LOW,UPDATETIME';
    
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
    const maxPages = 10; // Защита от бесконечного цикла (максимум 1000 акций)
    
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
      console.warn(`Reached maximum page limit (${maxPages}). Some stocks may be missing.`);
    }
    
    console.log(`Loaded ${allSecuritiesData.length} stocks from MOEX API`);
    
    // Удаляем дубликаты по SECID
    const uniqueSecuritiesMap = new Map<string, any[]>();
    const uniqueMarketdataMap = new Map<string, any[]>();
    
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
    
    console.log(`After deduplication: ${uniqueSecuritiesMap.size} unique stocks`);
    
    const securitiesData = Array.from(uniqueSecuritiesMap.values());
    const marketdataData = Array.from(uniqueMarketdataMap.values());
    
    // Создаем индекс для колонок
    const secColIndex: { [key: string]: number } = {};
    securitiesColumns.forEach((col: string, idx: number) => {
      secColIndex[col] = idx;
    });
    
    const mktColIndex: { [key: string]: number } = {};
    marketdataColumns.forEach((col: string, idx: number) => {
      mktColIndex[col] = idx;
    });
    
    // Создаем map для быстрого поиска marketdata по SECID
    const marketdataMap = new Map<string, { [key: string]: any }>();
    marketdataData.forEach((row: any[]) => {
      if (mktSecIdIndex !== -1 && row[mktSecIdIndex]) {
        const secId = row[mktSecIdIndex];
        const market: { [key: string]: any } = {};
        marketdataColumns.forEach((col: string, idx: number) => {
          market[col] = row[idx];
        });
        marketdataMap.set(secId, market);
      }
    });
    
    // Преобразуем данные в StockTableRow
    const allStocks: StockTableRow[] = securitiesData
      .map((row: any[]) => {
        const secId = (secColIndex['SECID'] !== undefined && row[secColIndex['SECID']]) || '';
        const shortName = (secColIndex['SHORTNAME'] !== undefined && row[secColIndex['SHORTNAME']]) || secId;
        const secName = (secColIndex['SECNAME'] !== undefined && row[secColIndex['SECNAME']]) || shortName;
        const lotSize = (secColIndex['LOTSIZE'] !== undefined && row[secColIndex['LOTSIZE']]) || 1;
        const issueSize = (secColIndex['ISSUESIZE'] !== undefined && row[secColIndex['ISSUESIZE']]) || 0;
        
        const market = marketdataMap.get(secId) || {};
        const price = (market['LAST'] && market['LAST'] > 0) ? market['LAST'] : 0;
        const prevPrice = (market['PREVPRICE'] && market['PREVPRICE'] > 0) ? market['PREVPRICE'] : price;
        const changePercent = market['LASTTOPREVPRICE'] || 0;
        const volume = market['VALTODAY'] || 0; // Объем в рублях
        const voltoday = market['VOLTODAY'] || 0; // Объем в штуках
        const numTrades = market['NUMTRADES'] || 0;
        const tradingStatus = market['TRADINGSTATUS'] || 'N/A';
        const high = (market['HIGH'] && market['HIGH'] > 0) ? market['HIGH'] : price;
        const low = (market['LOW'] && market['LOW'] > 0) ? market['LOW'] : price;
        
        // Расчет оборота (Turnover): (VOLTODAY / ISSUESIZE) * 100
        let turnover = 0;
        if (issueSize > 0 && voltoday > 0) {
          turnover = (voltoday / issueSize) * 100;
        }
        
        return {
          secId,
          shortName,
          secName,
          price,
          changePercent,
          volume,
          numTrades,
          lotSize,
          tradingStatus,
          prevPrice,
          high,
          low,
          issueSize: issueSize > 0 ? issueSize : undefined,
          voltoday: voltoday > 0 ? voltoday : undefined,
          turnover: turnover > 0 ? turnover : undefined
        };
      })
      .filter((stock: StockTableRow) => {
        // Фильтрация: исключаем акции без цены
        return stock.price > 0;
      });
    
    // Сортируем по объему (по убыванию) - это будет сортировка по умолчанию
    allStocks.sort((a, b) => b.volume - a.volume);
    
    // Получаем время обновления из первой строки (если не получили ранее)
    let updateTime: string | null = null;
    if (marketdataData.length > 0 && marketdataColumns) {
      const updatetimeIndex = marketdataColumns.indexOf('UPDATETIME');
      if (updatetimeIndex !== -1) {
        const firstRow = marketdataData[0];
        if (firstRow && firstRow[updatetimeIndex]) {
          updateTime = firstRow[updatetimeIndex];
        }
      }
    }
    
    return {
      stocks: allStocks,
      updateTime
    };
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
    return {
      stocks: [],
      updateTime: null
    };
  }
}

// Функция для получения исторических средних объемов за последние 5 рабочих дней
// Возвращает Record<secId, averageDailyVolume>
export async function fetchHistoricalAverageVolumes(): Promise<Record<string, number>> {
  try {
    // Генерируем массив дат за последние 10 дней (чтобы найти 5 рабочих дней)
    const dates: string[] = [];
    const today = new Date();
    let daysBack = 0;
    
    while (dates.length < 5 && daysBack < 14) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysBack);
      
      // Пропускаем выходные (суббота = 6, воскресенье = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        dates.push(dateStr);
      }
      
      daysBack++;
    }
    
    if (dates.length === 0) {
      console.warn('No working days found for historical volume calculation');
      return {};
    }
    
    // Запрашиваем данные параллельно для всех дат
    const historyPromises = dates.map(async (date) => {
      try {
        const url = `https://iss.moex.com/iss/history/engines/stock/markets/shares/boards/TQBR/securities.json?date=${date}&iss.meta=off&iss.only=history&history.columns=SECID,VALTODAY`;
        const response = await fetch(url);
        
        if (!response.ok) {
          return null;
        }
        
        const data = await response.json();
        const historyData = data.history?.data || [];
        const columns = data.history?.columns || [];
        
        const secIdIndex = columns.indexOf('SECID');
        const valTodayIndex = columns.indexOf('VALTODAY');
        
        if (secIdIndex === -1 || valTodayIndex === -1) {
          return null;
        }
        
        // Создаем Map<secId, volume> для этой даты
        const dayVolumes = new Map<string, number>();
        historyData.forEach((row: any[]) => {
          const secId = row[secIdIndex];
          const volume = Number(row[valTodayIndex]) || 0;
          if (secId && volume > 0) {
            dayVolumes.set(secId, volume);
          }
        });
        
        return dayVolumes;
      } catch (err) {
        console.error(`Failed to fetch history for date ${date}:`, err);
        return null;
      }
    });
    
    const historyResults = await Promise.all(historyPromises);
    
    // Фильтруем пустые результаты и собираем объемы по тикерам
    const volumesByTicker = new Map<string, number[]>();
    
    historyResults.forEach((dayVolumes) => {
      if (dayVolumes) {
        dayVolumes.forEach((volume, secId) => {
          if (!volumesByTicker.has(secId)) {
            volumesByTicker.set(secId, []);
          }
          volumesByTicker.get(secId)!.push(volume);
        });
      }
    });
    
    // Рассчитываем средний дневной объем (ADV) для каждого тикера
    const result: Record<string, number> = {};
    volumesByTicker.forEach((volumes, secId) => {
      if (volumes.length > 0) {
        const sum = volumes.reduce((acc, v) => acc + v, 0);
        const avg = sum / volumes.length;
        result[secId] = avg;
      }
    });
    
    console.log(`Calculated ADV for ${Object.keys(result).length} stocks from ${dates.length} trading days`);
    return result;
  } catch (error) {
    console.error('Failed to fetch historical average volumes:', error);
    return {};
  }
}
