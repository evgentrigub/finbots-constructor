import { StrategyType } from "./strategy-type";

export interface CreateBotDto {
  ticker: string;
  strategy: StrategyType;
}

export interface BotConfigutation {
  token: string, 
  ticker: string, 
  strategyType: StrategyType, 
  prod: boolean,
}
