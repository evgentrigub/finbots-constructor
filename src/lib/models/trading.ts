import OpenAPI, { OperationType } from "@tinkoff/invest-openapi-js-sdk";
import { ScheduledTask } from "node-cron";

export const TINKOFF_REST_SANDBOX = 'https://api-invest.tinkoff.ru/openapi/sandbox/';
export const TINKOFF_REST_PROD = 'https://api-invest.tinkoff.ru/openapi';
export const TINKOFF_WSS_URL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';

export interface TradeApiArrays {
    sandbox: TradeAPI[],
    prod: TradeAPI[]
  }
  export interface TradeAPI {
    token: string,
    api: OpenAPI,
    crons: CronTask[]
  }

export type OperationTypeFromAdvice = OperationType | 'Nothing';

export enum CronStatus {
    Scheduled = 'Scheduled',
    Stopped = 'Stopped',
    Destroyed = 'Destroyed'
}

export interface TradeCron {
    id: number;
    ticker: string;
    status: CronStatus;
}

export interface CronTask extends TradeCron {
    task: ScheduledTask
}

export interface TradeAPI {
    token: string,
    api: OpenAPI,
    crons: CronTask[]
}

export class UserCrons {
    userTradeToken: string;
    bots: TradeCron[];
}
