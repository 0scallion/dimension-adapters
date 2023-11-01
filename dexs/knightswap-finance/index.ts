import { SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
const {
  getChainVolume,getChainVolumeWithGasToken
} = require("../../helpers/getUniSubgraphVolume");
const { getStartTimestamp } = require("../../helpers/getStartTimestamp");

const endpoints = {
  [CHAIN.BSC]: "https://api.thegraph.com/subgraphs/id/QmPQfcovYgjF2vyGBE4LwXaSYj7Bgfvbny8MBpgLSBVKjB",
  [CHAIN.FANTOM]: "https://api.thegraph.com/subgraphs/name/shahzeb8285/thedarkknightanalytics",
};

const v1Graph = getChainVolume({
  graphUrls: endpoints,
  totalVolume: {
    factory: "uniswapFactories",
    field: "totalVolumeUSD",
  },
  dailyVolume: {
    factory: "uniswapDayData",
    field: "dailyVolumeUSD",
  },
});

const v2Graph = getChainVolumeWithGasToken({
  graphUrls: endpoints,
  totalVolume: {
    factory: "pancakeFactories",
    field: "totalVolumeUSD",
  },
  dailyVolume: {
    factory: "pancakeDayData",
    field: "dailyVolumeUSD",
  },
});


const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.BSC]: {
      fetch: v1Graph(CHAIN.BSC),
      start: getStartTimestamp({
        endpoints,
        chain: CHAIN.BSC,
        dailyDataField: `uniswapDayDatas`,
      }),
    },
    [CHAIN.FANTOM]: {
      fetch: v2Graph(CHAIN.FANTOM),
      start: getStartTimestamp({
        endpoints,
        chain: CHAIN.FANTOM,
        dailyDataField: `pancakeDayDatas`,
      }),
    },
  },
};

export default adapter;
