import { CHAIN } from "../../helpers/chains";
import { comptrollerABI, CTokenABI, veloGaugeAbi } from "./_abi";
import * as sdk from "@defillama/sdk";

const getAllMarkets = async (
  unitroller: string,
  chain: CHAIN
): Promise<string[]> => {
  return (
    await sdk.api.abi.call({
      target: unitroller,
      abi: comptrollerABI.getAllMarkets,
      chain: chain,
    })
  ).output;
};

const getMarketDetails = async (markets: string[], chain: CHAIN) => {
  const underlyings = await sdk.api.abi.multiCall({
    calls: markets.map((market: string) => ({
      target: market,
    })),
    abi: CTokenABI.underlying,
    chain: chain,
  });

  const reserveFactors = await sdk.api.abi.multiCall({
    calls: markets.map((market: string) => ({
      target: market,
    })),
    abi: CTokenABI.reserveFactorMantissa,
    chain: chain,
  });

  return {
    underlyings: underlyings.output.map((x: any) => x.output),
    reserveFactors: reserveFactors.output.map((x: any) => x.output),
  };
};

const getVeloGaugeDetails = async (
  gauge: string,
  token: string,
  account: string,
  chain: CHAIN,
) => {
  const lastEarn = await sdk.api.abi.call({
    target: gauge,
    abi: veloGaugeAbi.lastEarn,
    chain: chain,
    params: [token, account],
  });
  const earned = await sdk.api.abi.call({
    target: gauge,
    abi: veloGaugeAbi.earned,
    chain: chain,
    params: [token, account],
  });

  return {
    lastEarn: lastEarn.output,
    earned: earned.output,
  };
};

export { getAllMarkets, getMarketDetails, getVeloGaugeDetails };
