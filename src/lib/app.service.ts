import { existedAPIs } from "../main";
import { TradeAPI } from "./models/trading";
import { TinkoffService } from "./tinkoff.service";

export class AppService {
  constructor(private tinkoffService: TinkoffService) { }

  /**
   * todo
   */
  public async getTradeApiInfo(token: string, prod = false): Promise<TradeAPI> {
    if (prod) {
      const existedProdApi = existedAPIs.prod.find(el => el.token === token)
      if (existedProdApi) {
        return existedProdApi;
      } else {
        const newApiInfo = <TradeAPI>{ token, api: this.tinkoffService.createTinkoffApiProd(token), crons: [] };
        const portfolio = await newApiInfo.api.portfolio();
        console.log(`🚀 ~ file: app.service.ts ~ getTradeApiInfo ~ portfolio is ${portfolio ? 'OK' : 'BAD'}`)
        existedAPIs.prod.push(newApiInfo)
        return newApiInfo;
      }
    }

    const existedSandboxApi = existedAPIs.sandbox.find(el => el.token === token)
    if (existedSandboxApi) {
      console.log("🚀 ~ file: app.service.ts ~ getTradeApiInfo ~ existedApiInfo")
      return existedSandboxApi;
    } else {
      const newApiInfo = <TradeAPI>{ token, api: this.tinkoffService.createTinkoffApiSandbox(token), crons: [] };
      await this.tinkoffService.setSandboxBalance(newApiInfo.api, 10000);
      const portfolio = await newApiInfo.api.portfolio();
      console.log("🚀 ~ file: app.service.ts ~ getTradeApiInfo ~ portfolio", portfolio)
      existedAPIs.sandbox.push(newApiInfo)
      return newApiInfo;
    }
  }

  public checkStatus(res: any) {
    if (res.ok) {
      return res;
    } else {
      console.error(JSON.stringify(res));
      throw `Server Error`;
    }
  };
}
