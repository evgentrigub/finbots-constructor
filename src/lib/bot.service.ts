import { AppService } from "./app.service";
import { CronService } from "./cron.service";
import { BotConfigutation } from "./models/bot.dto";
import { StrategyType, TechAnalyzeStrategy, TECH_ANALYZE_STRATEGIES } from "./models/strategy";

export class BotService {
    constructor(
        private appService: AppService,
        private cronService: CronService,
    ){}

    public async createBot(config: BotConfigutation){ 
        const { prod, strategyType, token, ticker } = config;
        if (prod) {
            console.log("🚀 ~ file: bots.service.ts ~ create ~ ------ PROD ------ ")
        }
        const strategyInfo = this.getStrategy(strategyType);
        const apiInfo = await this.appService.getTradeApiInfo(token, prod);
        const cron = this.cronService.createCronTask(apiInfo, ticker, strategyInfo);
    
        return cron.ticker;
    }

    /**
     * Возвращает стратегию по типу
     * В завимсимости от типа идет поиск стратении в нужно массиве
     * Пока есть только одна стратегия
     * todo добавить другие параметры фильтра стратегии
     * @param strategyType 
     */
    private getStrategy(strategyName: string): TechAnalyzeStrategy | undefined {
        switch (strategyName) {
        case StrategyType.simpleTV:
            return TECH_ANALYZE_STRATEGIES.find(el => el.type === strategyName)?.payload;
        default:
            return undefined;
        }
    }    
}