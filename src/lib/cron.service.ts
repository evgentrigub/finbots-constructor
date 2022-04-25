import OpenAPI, { OperationType } from '@tinkoff/invest-openapi-js-sdk';
import cron, { ScheduledTask } from 'node-cron';
import { TechAnalyzeStrategy } from './models/strategy';
import { CronTask, TradeAPI, TradeCron } from './models/trading';
import { CronStatus } from './models/trading';
import { AnalyzeService } from './analyze.service';
import { TinkoffService } from './tinkoff.service';

export class CronService {
  constructor(
    private analyzeService: AnalyzeService,
    private tinkoffService: TinkoffService,
  ) { }

  public createCronTask(apiInfo: TradeAPI, ticker: string, strategy: TechAnalyzeStrategy): TradeCron {
    const cronExperssion = this.getCronScheduleExpession(strategy);
    // TODO: сделать id, как guid или тикер (тикер в торговом роботе уникальный); 
    const cronId = apiInfo.crons.length + 1;
    const task = cron.schedule(cronExperssion, () => this.tradeTechAnalyzeStrategy(apiInfo.api, ticker, cronId));

    const tradeCron: TradeCron = { id: cronId, ticker, status: CronStatus.Scheduled };
    const cronTask: CronTask = { ...tradeCron, task }
    apiInfo.crons.push(cronTask);
    console.log(`🚀 ~ file: cron.service.ts ~ createCronTask ~ bot id:${cronTask.id}, status:${cronTask.status}`)
    return tradeCron;
  }

  public stopCronTask(task: ScheduledTask): string {
    task.stop();
    console.log("🚀 ~ file: cron.service.ts ~ stopTask")
    return CronStatus.Stopped;
  }

  public startCronTask(task: ScheduledTask): string {
    task.start();
    console.log("🚀 ~ file: cron.service.ts ~ startTask")
    return CronStatus.Scheduled;
  }

  public getCronTasksStatus(apiInfo: TradeAPI): TradeCron[] {
    return apiInfo.crons.map(el => ({ id: el.id, ticker: el.ticker, status: el.status }));
  }

  /**
  * Возращает выражение с расписанием работы cron job
  * todo добавить интервал работы только по будням
  * для америки с 17:00 до 22:30
  * для россии с 10:00 до 17:30
  * 
  * ```js
  * ┌────────────── second (optional)
  * │ ┌──────────── minute
  * │ │ ┌────────── hour
  * │ │ │ ┌──────── day of month
  * │ │ │ │ ┌────── month
  * │ │ │ │ │ ┌──── day of week
  * │ │ │ │ │ │
  * │ │ │ │ │ │
  * * * * * * *
  * ```
  */
  public getCronScheduleExpession(strategy: TechAnalyzeStrategy): string {
    console.log("🚀 ~ file: cron.service.ts ~ getCronScheduleExpession ~ strategy", strategy)
    // const seconds = strategy.interval ? `*/${strategy.interval}` : '*';
    // const hours = strategy.country === 'america' ? '12-22' : '*';
    // const days = 'Monday-Friday'

    // const str = `${seconds} * ${hours} * * ${days}`;

    return `*/30 * * * * *`;
    // return str;
  }

  /**
  * Bot trade algorithm with simple technical analyze strategy
  * https://tinkoff.github.io/invest-openapi/orders/
  * TODO: check account balance, after getting price from orderbook, use isAccountBalanceEnough from TinkoffService
  * @param api broker API
  * @param ticker security ticker
  * @param botId current bot id
  */
  public async tradeTechAnalyzeStrategy(api: OpenAPI, ticker: string, botId: number): Promise<void> {
    console.log('--------------------------')
    console.log('----- Start Strategy -----')
    console.log('--------------------------')

    // 1) Cancel active orders, if they existed
    await this.tinkoffService.cancelActiveOrder(api, ticker);

    // 2) Get the operation type: buy, sell or nothing 
    // TODO: add param random and edit method for random signal
    const operation = await this.analyzeService.getOperationPosition(ticker);
    if (operation === 'Nothing') {
      console.log("🚀 ~ file: cron.service.ts ~ tradeTechAnalyzeStrategy ~ operation type is 'nothing'")
      console.log('--------------------------')
      console.log('----- End Strategy -----')
      console.log('--------------------------')
      console.log('')
      return;
    }

    // 3) Main bot strategy: how to place order
    await this.setOrderStrategy(api, botId, operation, ticker);
  }

  /**
   * Check the conditions of how to place order
   * @param api broker API
   * @param operation type: buy or sell
   * @param instrument 
   * @param ticker todo: get ticker from instrument
   * @param price price of security
   */
  public async setOrderStrategy(api: OpenAPI, botId: number, operation: OperationType, ticker: string): Promise<void> {
    const instrument = await api.instrumentPortfolio({ ticker });
    if (instrument == null) {
      await this.tinkoffService.getMarketOrderPosition(api, ticker, operation);
      // TODO add create bot operation, add property cronId 
      // const dto: CreateOperationDto = {
      //   botId,
      //   isSuccess: true,
      //   isLong: operation === 'Buy',
      // }
      // await this.operationService.create(dto);
      const accounts = await api.accounts();
      console.log(`🚀 ~ file: cron.service.ts ~ placeOrderStrategy ~ botId:${botId}, ticker:${ticker}, user:${accounts.accounts[0].brokerAccountId}`)
      console.log('--------------------------')
      console.log('----- End Strategy -----')
      console.log('--------------------------')
      console.log('')
      return;
    }

    // return from placing, if we have lots in right way
    if ((instrument.lots > 0 && operation == "Buy") || (instrument.lots < 0 && operation == "Sell")) {
      console.log(`🚀 ~ file: cron.service.ts ~ placeOrderStrategy ~ ! NOTHING !`)
      console.log('--------------------------')
      console.log('----- End Strategy -----')
      console.log('--------------------------')
      console.log('')
      return;
    }

    // change position to 'long', if were in 'short'
    if (instrument.lots < 0 && operation == "Buy") {
      await this.tinkoffService.getMarketOrderPosition(api, ticker, "Buy", 2);
      console.log(`🚀 ~ file: cron.service.ts ~ placeOrderStrategy ~ ! BUY !`)
      // await OperationRepository.create(price, 2, true, true, price * 0.05);
    }

    // TODO: add check if shoty is possible for ticker
    // change position to 'short', if were in 'long'
    if (instrument.lots > 0 && operation == "Sell") {
      await this.tinkoffService.getMarketOrderPosition(api, ticker, "Sell", 2);
      console.log(`🚀 ~ file: cron.service.ts ~ placeOrderStrategy ~ ! SELL !`)
      // await OperationRepository.create(price, 2, true, false, price * 0.05);
    }

    console.log('--------------------------')
    console.log('----- End Strategy -----')
    console.log('--------------------------')
    console.log('')
  }
}
