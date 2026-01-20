import logger from "../logger";

enum VehicleType {
  ClassicBike = "CLASSIC",
  EBike = "EBIKE",
}
type VehicleTypeMap = Record<VehicleType, string>;

type VehicleTypeApiResponse = {
  data: {
    vehicle_types: {
      form_factor: string;
      propulsion_type: string;
      vehicle_type_id: string;
    }[];
  };
};

const VEHICLE_TYPES_API_URL =
  "https://gbfs.lyft.com/gbfs/2.3/dca-cabi/en/vehicle_types.json";

export const fetchVehicleTypes: () => Promise<VehicleTypeMap> = async () => {
  logger.info("Fetching vehicle types");
  const response = await fetch(VEHICLE_TYPES_API_URL);
  const vehicleTypeResponse = (await response.json()) as VehicleTypeApiResponse;

  const vehicleTypeData = vehicleTypeResponse.data.vehicle_types;

  const classicVehicleTypeId = vehicleTypeData.find((vehicleType) => {
    return (
      vehicleType.form_factor === "bicycle" &&
      vehicleType.propulsion_type === "human"
    );
  })?.vehicle_type_id;
  const eBikeVehicleTypeId = vehicleTypeData.find((vehicleType) => {
    return (
      vehicleType.form_factor === "bicycle" &&
      vehicleType.propulsion_type === "electric_assist"
    );
  })?.vehicle_type_id;

  if (!classicVehicleTypeId) {
    throw "Failed to load vehicle type for classic bike";
  } else if (!eBikeVehicleTypeId) {
    throw "Failed to load vehicle type for ebike";
  }

  return {
    [VehicleType.ClassicBike]: classicVehicleTypeId,
    [VehicleType.EBike]: eBikeVehicleTypeId,
  };
};
