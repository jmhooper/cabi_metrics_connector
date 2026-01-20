import logger from "../logger";

type RegionName = string;
type RegionMap = Record<string, RegionName>;

type SystemRegionsApiResponse = {
  data: {
    regions: {
      region_id: string;
      name: string;
    }[];
  };
};

const SYSTEM_REGIONS_API_URL =
  "https://gbfs.lyft.com/gbfs/2.3/dca-cabi/en/system_regions.json";

export const fetchRegions: () => Promise<RegionMap> = async () => {
  logger.info("Fetching regions");
  const response = await fetch(SYSTEM_REGIONS_API_URL);
  const systemRegionsRespones =
    (await response.json()) as SystemRegionsApiResponse;

  const result: RegionMap = {};
  systemRegionsRespones.data.regions.forEach((region) => {
    result[region.region_id] = region.name;
  });
  return result;
};
