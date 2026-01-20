import logger from "../logger";
import { fetchRegions } from "./regions";
import { fetchVehicleTypes } from "./vehicle-types";

type StationInformation = {
  name: string;
  region: string;
  station_id: string;
  capacity: number;
  latitude: number;
  longitude: number;
};

type StationMap = Record<string, StationInformation>;

type StationInformationApiResponse = {
  data: {
    stations: {
      region_id: string;
      station_id: string;
      name: string;
      capacity: number;
      lon: number;
      lat: number;
    }[];
  };
};

const STATION_INFORMATION_API_URL =
  "https://gbfs.lyft.com/gbfs/2.3/dca-cabi/en/station_information.json";

export const fetchStationInformation: () => Promise<StationMap> = async () => {
  const regionMap = await fetchRegions();

  logger.info("Fetching station information");
  const response = await fetch(STATION_INFORMATION_API_URL);
  const stationInformationApiResponse =
    (await response.json()) as StationInformationApiResponse;

  const result: StationMap = {};
  stationInformationApiResponse.data.stations.forEach((station) => {
    result[station.station_id] = {
      name: station.name,
      region: regionMap[station.region_id] || "",
      station_id: station.station_id,
      capacity: station.capacity,
      latitude: station.lat,
      longitude: station.lon,
    };
  });
  return result;
};

export type Station = StationInformation & {
  nun_ebikes_available: number;
  num_classic_bikes_available: number;
  num_docks_available: number;
  num_bikes_disabled: number;
  num_docks_disabled: number;
  is_returning: number;
  is_renting: number;
};

type StationStatusApiResponse = {
  data: {
    stations: {
      station_id: string;
      vehicle_types_available: {
        count: number;
        vehicle_type_id: string;
      }[];
      is_returning: number;
      is_installed: number;
      num_bikes_disabled: number;
      num_docks_available: number;
      is_renting: number;
      num_docks_disabled: number;
    }[];
  };
};

const STATION_STATUS_API_URL =
  "https://gbfs.lyft.com/gbfs/2.3/dca-cabi/en/station_status.json";

export const fetchStationStatus: () => Promise<Station[]> = async () => {
  const stationInfo = await fetchStationInformation();
  const vehicleTypeMap = await fetchVehicleTypes();

  logger.info("Fetching station statuses");
  const response = await fetch(STATION_STATUS_API_URL);
  const stationStatusApiResponse =
    (await response.json()) as StationStatusApiResponse;

  return stationStatusApiResponse.data.stations.map((stationStatus) => {
    const StationInformation = stationInfo[stationStatus.station_id];

    const ebikeCount =
      stationStatus.vehicle_types_available.find(
        (vehicleCounts) =>
          vehicleCounts.vehicle_type_id === vehicleTypeMap.EBIKE,
      )?.count || 0;
    const classicBikeCount =
      stationStatus.vehicle_types_available.find(
        (vehicleCounts) =>
          vehicleCounts.vehicle_type_id === vehicleTypeMap.CLASSIC,
      )?.count || 0;

    const station: Station = {
      ...StationInformation,
      nun_ebikes_available: ebikeCount,
      num_classic_bikes_available: classicBikeCount,
      num_docks_available: stationStatus.num_docks_available,
      num_bikes_disabled: stationStatus.num_bikes_disabled,
      num_docks_disabled: stationStatus.num_docks_disabled,
      is_returning: stationStatus.is_returning,
      is_renting: stationStatus.is_renting,
    };
    return station;
  });
};
