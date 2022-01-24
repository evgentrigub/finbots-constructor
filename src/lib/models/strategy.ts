export enum StrategyType {
  simpleTV = 'simpleTV',
  simpleRaddar = 'simpleRaddar',
  arbitration = 'arbitration'
}

export enum TechAnalyzeResource {
  TradingView = 'TradingView',
  Raddar = 'Raddar',
}

// -----
// Trading View
// -----
export type CountryType = 'russia' | 'america';
export type ExchangeType = 'NASDAQ' | 'NYSE' | 'MOEX';
export type PeriodAnalysisType = '1' | '5' | '15' | '60' | '240' | '' | '1W' | '1M';
export type AdviceType = 'ACTIVE SELL' | 'SELL' | 'NEUTRAL' | 'BUY' | 'ACTIVE BUY';

export interface AnalyzeResponse {
  data: [
    {
      s: string;
      // приходят те поля, которые заказываем в post-запросе
      d: number[];
    }
  ];
  totalCount: number;
}

/**
 * Модель стратегии по тех анализу 
 * @param interval - интревал времени, по которому идет запрос к ресурсу
 * @param period - период работы бота (по США или по России)
 * @param country - страна биржи (США или Россия)
 */
export interface TechAnalyzeStrategy {
  source: TechAnalyzeResource;
  interval: number;
  country: CountryType;
}

export interface Strategy {
  type: StrategyType;
  payload: TechAnalyzeStrategy;
}

/**
 * Массив стратегии с получением теханализа из источников
 * Стратегии могут быть разными по интревалу запросов и периоду работы
 */
export const TECH_ANALYZE_STRATEGIES: Strategy[] = [
  {
    type: StrategyType.simpleTV,
    payload: {
      source: TechAnalyzeResource.TradingView,
      interval: 5,
      country: 'america' // todo убрать, потому что заглушка
    }
  }
]