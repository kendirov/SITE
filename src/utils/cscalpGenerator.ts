import JSZip from 'jszip';
import { StockTableRow } from '../api/stocks';

/**
 * Генерирует настройки CScalp для списка акций
 * @param stocks Массив акций для генерации настроек
 * @returns Promise<Blob> ZIP-архив с настройками
 */
export async function generateCScalpSettings(stocks: StockTableRow[]): Promise<Blob> {
  const zip = new JSZip();
  
  // Фильтруем только акции (не индексы) с валидными данными
  const validStocks = stocks.filter(stock => 
    !stock.isIndex && 
    stock.price > 0 && 
    stock.lotSize > 0 &&
    stock.secId
  );

  // Генерируем XML файл для каждой акции
  for (const stock of validStocks) {
    const xmlContent = generateStockXML(stock);
    const filePath = `Data/MVS/XDSD.TQBR.${stock.secId}_Settings.xml`;
    zip.file(filePath, xmlContent);
  }

  // Генерируем ZIP-архив
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

/**
 * Генерирует XML настройки для одной акции
 */
function generateStockXML(stock: StockTableRow): string {
  // Базовые параметры
  const lotSize = stock.lotSize || 1;
  const price = stock.price;
  const minStep = 0.01; // Стандартный шаг для акций MOEX
  
  // Объем в лотах (если volume в рублях, переводим в лоты)
  const volumeInLots = stock.volume > 0 && price > 0 && lotSize > 0
    ? Math.round(stock.volume / (price * lotSize))
    : 1000; // Fallback значение

  // Крупные объемы (в лотах)
  const largeVol1 = Math.max(100, Math.round(volumeInLots / 100)); // 1% от дневного объема, минимум 100
  const largeVol2 = largeVol1 * 2;
  const domFill = Math.max(1, Math.round(largeVol1 / 2));
  const clusterFill = largeVol1;

  // Рабочие объемы (Working Volumes) - 5 кнопок
  // Рассчитываем лоты для сумм: 10 000₽, 20 000₽, 50 000₽, 100 000₽, 200 000₽
  const workAmounts = [10000, 20000, 50000, 100000, 200000];
  const workVols = workAmounts.map(amount => {
    if (price > 0 && lotSize > 0) {
      return Math.max(1, Math.round(amount / (price * lotSize)));
    }
    return 1;
  });

  // Генерация XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Settings>
  <Shared>
    <WorkingAmounts>
      <Item Value="${workVols[0]}" />
      <Item Value="${workVols[1]}" />
      <Item Value="${workVols[2]}" />
      <Item Value="${workVols[3]}" />
      <Item Value="${workVols[4]}" />
    </WorkingAmounts>
    <DomParams>
      <FillAmount Value="${domFill}" />
      <BigAmount1 Value="${largeVol1}" />
      <BigAmount2 Value="${largeVol2}" />
    </DomParams>
    <ClusterParams>
      <FillAmount Value="${clusterFill}" />
      <TimeFrame Value="3600" />
    </ClusterParams>
    <RulerParams>
      <StepPrice Value="${minStep}" />
    </RulerParams>
  </Shared>
</Settings>`;

  return xml;
}

/**
 * Скачивает файл настроек CScalp
 */
export async function downloadCScalpSettings(stocks: StockTableRow[]): Promise<void> {
  try {
    const blob = await generateCScalpSettings(stocks);
    
    // Формируем имя файла с датой
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `CScalp_Settings_${dateStr}.scs`;
    
    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Освобождаем память
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка при генерации настроек CScalp:', error);
    throw error;
  }
}
