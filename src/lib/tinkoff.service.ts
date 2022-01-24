
import OpenAPI, { OrderStatus, MarketInstrument, OperationType, Operations } from '@tinkoff/invest-openapi-js-sdk';
import { TINKOFF_REST_PROD, TINKOFF_REST_SANDBOX, TINKOFF_WSS_URL } from './models/trading';

export class TinkoffService {

  /** 
   * Creates Tinkoff sandbox
   */
  public createTinkoffApiSandbox(secretToken: string): OpenAPI {
    try {
      const api = new OpenAPI({ apiURL: TINKOFF_REST_SANDBOX, secretToken, socketURL: TINKOFF_WSS_URL });
      console.log("🚀 ~ file: tinkoff.service.ts ~ api -> Sandbox was created!!!")
      api.sandboxClear();
      return api;
    } catch (error) {
      console.error("🚀 ~ file: tinkoff.service.ts ~ createTinkoffSandbox ~ error", JSON.stringify(error))
      throw error;
    }
  }

  /**
   * Creates prod Tinkoff api
   */
  public createTinkoffApiProd(secretToken: string): OpenAPI {
    try {
      const api = new OpenAPI({ apiURL: TINKOFF_REST_PROD, secretToken, socketURL: TINKOFF_WSS_URL });
      console.log("-----------------------------------------------------------------")
      console.log("🚀 ~ file: tinkoff.service.ts ~ createTinkoffApi PROD !!!")
      console.log("-----------------------------------------------------------------")
      return api;
    } catch (error) {
      console.error("🚀 ~ file: tinkoff.service.ts ~ createTinkoffSandbox ~ error", JSON.stringify(error))
      throw error;
    }
  }

  /**
   * Market order position
   * @param api Tinkoff API
   * @param ticker ценная бумага
   * @param lots количество лотов
   * @param operation покупка/продажа
   */
  public async getMarketOrderPosition(api: OpenAPI, ticker: string, operation: OperationType, lots: number = 1): Promise<OrderStatus | undefined> {
    try {
      // Ищем инструмент по тикеру
      const instrument = this.getInfoByTickerTinkoff(api, ticker)
      const { figi } = await instrument;
      console.log(`🚀 ~ file: tinkoff.service.ts ~ putMarketOrderPosition ~ Params for order (${operation}, ${ticker}, ${lots})`);

      const placedOrder = await api.marketOrder({ figi, lots, operation }); // Покупаем инструмент по figi
      console.log("🚀 ~ file: tinkoff.service.ts ~ putMarketOrderPosition ~ status of placed order", placedOrder.status)
      return placedOrder.status;
    } catch (error) {
      console.error("🚀 ~ file: tinkoff.service.ts ~ putMarketOrderPosition ~ error", JSON.stringify(error))
      throw error;
    }
  }

  /**
   * Gets portfolio instruments
   * @param api Tinkoff API
   */
  public async getPortfolioPositins(api: OpenAPI) {
    try {
      return await api.portfolio();
    } catch (error) {
      console.error("🚀 ~ file: tinkoff.service.ts ~ checkPortfolio ~ error", JSON.stringify(error))
      throw error;
    }
  }

  /**
   * Gets infotmation by ticker
   * @param api Tinkoff API
   * @param ticker ценная бумага
   */
  public getInfoByTickerTinkoff = async (api: OpenAPI, ticker: string): Promise<MarketInstrument | null> => {
    try {
      const instrument = await api.searchOne({ ticker });

      if (!instrument) {
        return null;
      }
      return instrument;

    } catch (error) {
      console.error("🚀 ~ file: tinkoff.service.ts ~ checkPortfolio ~ error", JSON.stringify(error))
      throw error;
    }
  }

  /**
   * Sets sandbox balance
   * @param api Tinkoff API
   * @param balance сумма
   */
  public async setSandboxBalance(api: OpenAPI, balance: number) {
    await api.setCurrenciesBalance({ currency: 'USD', balance });
    const portfolio = await api.portfolio();
    if (portfolio.positions.length === 0) {
      this.setSandboxBalance(api, balance);
      console.log("🚀 ~ file: tinkoff.service.ts ~ setSandboxBalance ~ again", portfolio.positions.length)
    }
  }

  /**
   * Сhecks if there is enough money to trade with the broker account
   * @param api broker API
   * @param price instrument price
   * @returns 
   */
  public async isAccountBalanceEnough(api: OpenAPI, price: number): Promise<boolean> {
    const balance = await this.getAccountBalance(api);
    const realPrice = price * 1.03;
    console.log("🚀 ~ file: tinkoff.service.ts ~ trade ~ currency", balance)
    // todo добавить суммы комиссии
    if (balance < realPrice) {
      console.log(`🚀 ~ Insufficient funds!!! Required: ${price}, balance: ${balance}`);
      return false;
    }
    return true;
  }

  /**
   * Gets currency balance value 
   * @param api broker API
   * @returns balance value
   */
  public async getAccountBalance(api: OpenAPI): Promise<number> {
    const portfolio = (await api.portfolio()).positions;
    // todo исправить получение валюты (сейчас берет первую валюту, и это Евро, а нужны именно доллары)
    const balance = portfolio.find(c => c.instrumentType == 'Currency')?.balance;
    if (balance == undefined) {
      console.log("🚀 ~ file: tinkoff.service.ts ~ GetBalance ~ balance is underfined");
      return 0;
    }
    return balance;
  }

  /**
   * Cancels order by ticker
   * @param ticker security ticker
   * @param api broker API
   * @returns balance value
   */
  public async cancelActiveOrder(api: OpenAPI, ticker: string): Promise<void> {
    const instrument = await this.getInfoByTickerTinkoff(api, ticker);
    const orders = (await api.orders()).filter(el => el.figi == instrument?.figi);
    console.log("🚀 ~ file: tinkoff.service.ts ~ CancelActiveOrder ~ orders quantity", orders.length)
    if (orders.length !== 0) {
      const promises = orders.map(el => api.cancelOrder({ orderId: el.orderId }));
      await Promise.all(promises);
    }
  }

  /**
   * Return last operations by ticker
   */
  public async getOperations(api: OpenAPI, ticker: string): Promise<Operations> {
    const instrument = await this.getInfoByTickerTinkoff(api, ticker)
    const operations = api.operations({
      // TODO last two minutes
      from: new Date().toUTCString(),
      to: new Date().toUTCString(),
      figi: instrument.figi
    })
    return operations;
  }

  // /**
  //  * Limits order position
  //  * @param api Tinkoff API
  //  * @param ticker ценная бумага
  //  * @param lots количество лотов
  //  * @param price цена за лот
  //  */
  // public async limitOrderPosition(api: OpenAPI, ticker: string, lots: number, price: number, operation: OperationType): Promise<OrderStatus | undefined> {
  //   try {
  //     // Ищем инструмент по тикеру
  //     const instrument = await api.searchOne({ ticker });
  //     if (!instrument) {
  //       console.error(`🚀 ~ file: tinkoff.service.ts ~ limitOrderPosition: Error Not found ticker: ${ticker}`)
  //       return;
  //     }
  //     const { figi } = instrument;
  //     console.log(`🚀 ~ file: tinkoff.service.ts ~ limitOrderPosition ~ Params for order (${operation}, ${ticker}, ${lots}, ${price})`);

  //     const placedOrder = await api.limitOrder({ figi, lots, operation, price }); // Покупаем инструмент по figi
  //     console.log("🚀 ~ file: tinkoff.service.ts ~ limitOrderPosition ~ status of placed order", placedOrder.status)
  //     return placedOrder.status;
  //   } catch (error) {
  //     console.error("🚀 ~ file: tinkoff.service.ts ~ limitOrderPosition ~ error", JSON.stringify(error))
  //     throw error;
  //   }
  // }

}
