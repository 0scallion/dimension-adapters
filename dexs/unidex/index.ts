import { SimpleAdapter, FetchResultVolume } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getTimestampAtStartOfDayUTC } from "../../utils/date";
import { Chain } from "@defillama/sdk/build/general";
import request, { gql } from "graphql-request";

interface IReferralRecord {
  volume: string; // Assuming volume is a string that represents a number
  timestamp: number;
}

type TChainIDs = {
  [key in Chain]?: number;
};

const chainIDs: TChainIDs = {
  [CHAIN.FANTOM]: 250,
  [CHAIN.ARBITRUM]: 42161,
  [CHAIN.OPTIMISM]: 10,
  [CHAIN.ERA]: 324,
  [CHAIN.BASE]: 8453,
};

interface IDayProduct {
  cumulativeVolumeUsd: number;
  _id: string;
}

const fetchReferralVolume = async (timestamp: number): Promise<number> => {
  const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp);

  const referralQuery = gql`
    {
      referrerStats(
        where: {referrer: "0x8c128f336b479b142429a5f351af225457a987fa", timestamp_gt: "${todaysTimestamp}"}
      ) {
        volume
      }
    }
  `;

  const referralEndpoint = 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-arbitrum-referrals';
  const referralRes = await request(referralEndpoint, referralQuery);

  // If there's no volume data, return 0
  if (!referralRes.referrerStats || referralRes.referrerStats.length === 0) {
    return 0;
  }

  return Number(referralRes.referrerStats[0].volume) / 10 ** 30;
};


const fetchMuxReferralVolume = async (timestamp: number): Promise<number> => {
  const startOfDayTimestamp = getTimestampAtStartOfDayUTC(timestamp);
  const endOfDayTimestamp = startOfDayTimestamp + 86400; // Add one day's worth of seconds for the end of the day

  const referralQuery = gql`
    query MyQuery($timestamp_gte: BigInt = "", $timestamp_lte: BigInt = "") {
      referralRecords(
        where: {
          referralCode: "0x556e694465780000000000000000000000000000000000000000000000000000",
          timestamp_gte: $timestamp_gte,
          timestamp_lte: $timestamp_lte
        }
      ) {
        volume
        timestamp
      }
    }
  `;

  const variables = {
    timestamp_gte: startOfDayTimestamp.toString(),
    timestamp_lte: endOfDayTimestamp.toString()
  };

  const referralEndpoint = 'https://api.thegraph.com/subgraphs/name/mux-world/mux-referral-arb';
  const referralRes = await request(referralEndpoint, referralQuery, variables);

  // Sum up the volumes
  let totalVolume = 0;

  if (referralRes.referralRecords && Array.isArray(referralRes.referralRecords)) {
    referralRes.referralRecords.forEach((record: IReferralRecord) => {
      const volume = parseFloat(record.volume);
      if (!isNaN(volume)) {
        totalVolume += volume / 10 ** 18; // Adjust the unit conversion as needed
      }
    });
  }

  return totalVolume;
};







const fetch = (chain: Chain) => {
  return async (timestamp: number): Promise<FetchResultVolume> => {
    const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp);

    const graphQuery = gql`
      query MyQuery {
        DayProducts(filter: {date: ${todaysTimestamp}}) {
          cumulativeVolumeUsd
          _id
        }
      }
    `;

    const endpoint = 'https://arkiver.moltennetwork.com/graphql';
    const response = await request(endpoint, graphQuery);
    const dayProducts: IDayProduct[] = response.DayProducts;

    const chainID = chainIDs[chain];
    let dailyVolumeUSD = 0;

    dayProducts.forEach((product) => {
      const productChainID = parseInt(product._id.split(':')[2]);
      if (productChainID === chainID) {
        dailyVolumeUSD += product.cumulativeVolumeUsd;
      }
    });

    if (chain === CHAIN.ARBITRUM) {
      const referralVolumeUSD = await fetchReferralVolume(timestamp);
      const muxReferralVolumeUSD = await fetchMuxReferralVolume(timestamp);
      dailyVolumeUSD += referralVolumeUSD + muxReferralVolumeUSD;
    }

    return {
      dailyVolume: dailyVolumeUSD.toString(),
      timestamp: todaysTimestamp
    };
  };
};


const methodology = {
  dailyVolume: "Sum of cumulativeVolumeUsd for all products on the specified chain for the given day",
};


const adapter: SimpleAdapter = {
    adapter: {
    [CHAIN.OPTIMISM]: {
        fetch: fetch(CHAIN.OPTIMISM),
        start: async ()  => 1687422746,
        meta: {
          methodology
        }
    },
    [CHAIN.ERA]: {
      fetch: fetch(CHAIN.ERA),
      start: async ()  => 1687422746,
      meta: {
        methodology
      }
    }, // use volume from other protocol it might be the duplicate value of the same protocol
    // [CHAIN.ARBITRUM]: {
    //   fetch: fetch(CHAIN.ARBITRUM),
    //   start: async ()  => 1687422746,
    //   meta: {
    //     methodology
    //   }
    // },
    [CHAIN.BASE]: {
      fetch: fetch(CHAIN.BASE),
      start: async ()  => 1687422746,
      meta: {
        methodology
      }
    },
    [CHAIN.FANTOM]: {
      fetch: fetch(CHAIN.FANTOM),
      start: async ()  => 1687422746,
      meta: {
        methodology
      }
    },
    [CHAIN.METIS]: {
      fetch: fetch(CHAIN.METIS),
      start: async ()  => 1687898060,
      meta: {
        methodology
      }
    },
  }
}

export default adapter;
