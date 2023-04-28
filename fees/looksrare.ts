import { Adapter } from "../adapters/types";
import { ETHEREUM } from "../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import { getTimestampAtStartOfDayUTC, getTimestampAtStartOfPreviousDayUTC } from "../utils/date";
import { getPrices } from "../utils/prices";
import BigNumber from "bignumber.js";

const endpoints = {
  [ETHEREUM]: "https://api.thegraph.com/subgraphs/name/messari/looksrare-ethereum",
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp);
      const yesterdaysTimestamp = getTimestampAtStartOfPreviousDayUTC(timestamp)
      const dateId = Math.floor(todaysTimestamp / 86400);
      const yesDateId = Math.floor(yesterdaysTimestamp / 86400);

      const graphQuery = gql
      `{
        today: marketplaceDailySnapshot(id: ${dateId}) {
          totalRevenueETH
          marketplaceRevenueETH
        },
        yesterday: marketplaceDailySnapshot(id: ${yesDateId}) {
          totalRevenueETH
          marketplaceRevenueETH
        }
      }`;
      const ethAddress = "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      const pricesObj: any = await getPrices([ethAddress], todaysTimestamp);
      const latestPrice = new BigNumber(pricesObj[ethAddress]["price"])

      const graphRes = await request(graphUrls[chain], graphQuery);
      const dailyFee = new BigNumber(graphRes.today.totalRevenueETH).minus(new BigNumber(graphRes.yesterday.totalRevenueETH)).multipliedBy(latestPrice)
      const dailyRev = new BigNumber(graphRes.today.marketplaceRevenueETH).minus(new BigNumber(graphRes.yesterday.marketplaceRevenueETH)).multipliedBy(latestPrice)

      return {
        timestamp,
        dailyFees: dailyFee.toString(),
        dailyRevenue: dailyRev.toString(),
        dailyHoldersRevenue: dailyRev.toString(),
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [ETHEREUM]: {
        fetch: graphs(endpoints)(ETHEREUM),
        start: async ()  => 1640775864,
    },
  }
}

export default adapter;
