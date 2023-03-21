//  Maverick v1 data
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";
import { Chain } from "@defillama/sdk/build/general";
import { getPrices } from "../../utils/prices";
const { request, gql } = require("graphql-request");

const info: { [key: string]: any } = {
  ethereum: {
    subgraph: "https://api.studio.thegraph.com/query/42519/maverick-v1/v0.0.6",
  },
};

const getData = async (chain: Chain, timestamp: number) => {
  const totdayTimestamp = getUniqStartOfTodayTimestamp(
    new Date(timestamp * 1000)
  );

  let returnCount = 1000;
  let daySum = 0;
  let totalSum = 0;
  let dayFee = 0;
  let totalFee = 0;
  let step = 0;
  while (returnCount == 1000) {
    const graphQL = `{
        poolDayStats(
          orderBy: id
          orderDirection: desc
          first: 1000
          skip: ${step * 1000}
          where: {timestamp: "${totdayTimestamp}"}
        ) {
          id
          pool {
            id
            tokenB {
              id
            }
            tokenA {
              id
            }
            tokenAVolume
            tokenBVolume
            fee
          }
          tokenAVolume
          tokenBVolume
          timestamp
        }
      }`;

    const data = await request(info[chain].subgraph, graphQL);
    returnCount = data.poolDayStats.length;
    step++;

    let tokenArray = [] as string[];
    for (const dailyData of data.poolDayStats) {
      tokenArray.push(chain + ":" + dailyData.pool.tokenA.id);
      tokenArray.push(chain + ":" + dailyData.pool.tokenB.id);
    }
    let unique = [...new Set(tokenArray)] as string[];
    const prices = await getPrices(unique, totdayTimestamp);

    for (const dailyData of data.poolDayStats) {
      const tokenAId = chain + ":" + dailyData.pool.tokenA.id;
      const tokenBId = chain + ":" + dailyData.pool.tokenB.id;
      daySum += Number(dailyData.tokenAVolume) * prices[tokenAId].price;
      daySum += Number(dailyData.tokenBVolume) * prices[tokenBId].price;
      dayFee +=
        Number(dailyData.tokenAVolume) *
        prices[tokenAId].price *
        dailyData.pool.fee;
      dayFee +=
        Number(dailyData.tokenBVolume) *
        prices[tokenBId].price *
        dailyData.pool.fee;

      totalSum += Number(dailyData.pool.tokenAVolume) * prices[tokenAId].price;
      totalSum += Number(dailyData.pool.tokenBVolume) * prices[tokenBId].price;
      totalFee +=
        Number(dailyData.pool.tokenAVolume) *
        prices[tokenAId].price *
        dailyData.pool.fee;
      totalFee +=
        Number(dailyData.pool.tokenBVolume) *
        prices[tokenBId].price *
        dailyData.pool.fee;
    }
  }

  return {
    dailyFees: `${dayFee}`,
    totalFees: `${totalFee}`,
    dailyUserFees: `${dayFee}`,
    totalUserFees: `${totalFee}`,
    totalVolume: `${totalSum}`,
    dailyVolume: `${daySum}`,
    timestamp: totdayTimestamp,
  };
};

export const fetchVolume = (chain: Chain) => {
  return async (timestamp: number) => {
    const data = await getData(chain, timestamp);

    return {
      totalVolume: data.totalVolume,
      dailyVolume: data.dailyVolume,
      timestamp: data.timestamp,
    };
  };
};

export const fetchFee = (chain: Chain) => {
  return async (timestamp: number) => {
    const data = await getData(chain, timestamp);

    return {
      timestamp,
      dailyFees: data.dailyFees,
      totalFees: data.totalFees,
      dailyUserFees: data.dailyUserFees,
      totalUserFees: data.totalUserFees,
    };
  };
};
