// import { asyncABC } from './lib/async'


// asyncABC().then(res => {
  //     console.log("🚀 ~ file: index.ts ~ line 7 ~ asyncABC ~ res", res)
  
  // })

import { AnalyzeService } from "./lib/analyze.service";
import { AppService } from "./lib/app.service"
import { BotService } from "./lib/bot.service";
import { CronService } from "./lib/cron.service";
import { BotConfigutation } from "./lib/models/bot.dto";
import { StrategyType } from "./lib/models/strategy-type";
import { TradeApiArrays } from "./lib/models/trading"
import { TinkoffService } from "./lib/tinkoff.service"

export const existedAPIs: TradeApiArrays = {
  sandbox: [],
  prod: []
}
class FinBotsConstructor {

  async run(){
    console.log('---- FinBots: start -----')

    const tinkoffService = new TinkoffService();
    const analyzeService = new AnalyzeService();

    const appService = new AppService(tinkoffService)
    const cronService = new CronService(analyzeService, tinkoffService);
    const botService = new BotService(appService, cronService);
    
    const config: BotConfigutation = {
      token: '',
      ticker: '',
      prod: false,
      strategyType: StrategyType.simpleTV
    }

    try {

      await botService.createBot(config);
      console.log(`---- FinBots: bot created, ticker:${config.ticker} -----`)

    } catch (error) {

      console.error("🚀 ~ file: main.ts ~ line 45 ~ FinBotsMain ~ run ~ error", error)
    
    }
  }
}

const app = new FinBotsConstructor();
app.run();
