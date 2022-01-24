import { ExchangeType, PeriodAnalysisType, CountryType, AdviceType, AnalyzeResponse } from './models/strategy';
import { OperationTypeFromAdvice } from './models/trading';

export class AnalyzeService {
  constructor() { }

  public async getFinancialAdvice(
    ticker: string = 'AAPL',
    exchange: ExchangeType = 'NASDAQ',
    period: PeriodAnalysisType = '',
    country: CountryType = 'america'
  ): Promise<AdviceType | undefined> {
    const url = `https://scanner.tradingview.com/${country}/scan`;
    const body = getScanBody(exchange, ticker, period);

    try {
      const responsePromise = fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
      responsePromise.then(res => this.checkStatus(res));

      const response = await responsePromise;
      const json = (await response.json()) as AnalyzeResponse;
      const adviceNumber = json.data[0]?.d[1];
      const advice = mapNumberToAction(adviceNumber);
      return advice;
    } catch (error) {
      console.error('🚀 ~ file: analyze.service.ts ~ getFinancialAdvice ~ Error: ', error);
      throw error
    }
  };

  /**
   * Возвращает тип операции: покупка, продажа или ничего не делать
   * @param ticker ценная бумага
   */
  public async getOperationPosition(ticker: string): Promise<OperationTypeFromAdvice> {

    // TODO: нужно найти другой источник c информацией о названии бирже по тикеру
    //
    // информация с Yahoo не всегда возвращается верная
    // например, тикер VEON в поле "info.exchDisp" вернул слово "Отрасль" 
    // (для других вроде возвращал верно)

    // const info = await getInfoByTicker(ticker.toLocaleUpperCase());
    // if (!info || typeof (info) === 'string') {
    //   console.error(`🚀 ~ file: analyze.service.ts ~ limitOrderPosition: Error Сompany not found`)
    //   return 'Nothing';
    // }

    try {
      // параметр Exchange выставлены NASDAQ, время получение теханализа - '1 минута'
      const advice = await this.getFinancialAdvice(ticker.toLocaleUpperCase(), 'NYSE', "1", "america");
      if (!advice) {
        return 'Nothing';
      }

      switch (advice) {
        case 'ACTIVE BUY':
        case 'BUY':
          return "Buy";
        case 'ACTIVE SELL':
        case 'SELL':
          return "Sell";
        case 'NEUTRAL':
        default:
          return 'Nothing';
      }
    } catch (error) {
      console.error('🚀 ~ file: analyze.service.ts ~ getOperationPosition ~ Error: ', error);
      throw error
    }
  }

  private checkStatus(res: any) {
    if (res.ok) {
      return res;
    } else {
      console.error(JSON.stringify(res));
      throw `Server Error`;
    }
  };
}

const mapNumberToAction = (value: number): AdviceType | undefined => {
  if (value > -1 && value <= -0.5) {
    return 'ACTIVE SELL';
  }
  if (value > -0.5 && value < 0) {
    return 'ACTIVE SELL';
  }
  if (value == 0) {
    return 'NEUTRAL';
  }
  if (value > 0 && value < 0.5) {
    return 'BUY';
  }
  if (value >= 0.5 && value < 1) {
    return 'ACTIVE BUY';
  }

  return 'NEUTRAL'
};

const getScanBody = (exchange: ExchangeType, ticker: string, period: PeriodAnalysisType) => {
  return {
    symbols: {
      tickers: [`${exchange}:${ticker}`],
      query: {
        types: [],
      },
    },
    columns: [
      period == '' ? `Recommend.Other` : `Recommend.Other|${period}`,
      period == '' ? `Recommend.All` : `Recommend.All|${period}`,
      period == '' ? `Recommend.MA` : `Recommend.MA|${period}`,
    ],
  };
};
