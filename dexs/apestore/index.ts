import { httpPost } from "../../utils/fetchURL"
import { SimpleAdapter, FetchResultVolume, FetchOptions, FetchResultV2, Adapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";

const URL = 'https://ape.store/api/public/base/volume'

interface VolumeInfo {
	dailyVolume: string;
	totalVolume: string;
	timeStamp: number;
}

const fetch = async (options: FetchOptions): Promise<FetchResultV2> => {
	const volumeData: VolumeInfo = await httpPost(URL, { date: options.startOfDay }, {
		headers: {
			"Authorization": "8690be69-3c53-4bc1-8e99-e4fe0472b757"
		},
	});

	return {
		totalVolume: volumeData.totalVolume,
		dailyVolume: volumeData.dailyVolume,
		timestamp: volumeData.timeStamp,
	};
};

const adapter: Adapter = {
	version: 2,
	adapter: {
		base: {
			fetch: async (options: FetchOptions): Promise<FetchResultV2> => {
				const volumeData: VolumeInfo = await httpPost(URL, { date: options.startOfDay }, {
					headers: {
						"Authorization": "8690be69-3c53-4bc1-8e99-e4fe0472b757"
					},
				});

				return {
					totalVolume: volumeData.totalVolume,
					dailyVolume: volumeData.dailyVolume,
					timestamp: volumeData.timeStamp,
				};
			},
			start: 1712265900,
		}
	},
};


export default adapter;