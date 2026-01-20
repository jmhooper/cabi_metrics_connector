import NodeCache from "node-cache";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { Registry, Gauge } from "prom-client";
import { Station, fetchStationStatus } from "./cabi-client/stations";
import logger from "./logger";

const stationStatusCache = new NodeCache({ stdTTL: 60, checkperiod: 0 });

const stationsStatuses: () => Promise<Station[]> = async () => {
  let statuses: Station[];
  let statusesFromCache = stationStatusCache.get("STATION_STATUSES");
  if (statusesFromCache === undefined) {
    statuses = await fetchStationStatus();
    stationStatusCache.set("STATION_STATUSES", statuses);
  } else {
    statuses = statusesFromCache as Station[];
  }
  return statuses;
};

const stationInformationLabels = [
  "station_name",
  "station_region",
  "station_id",
  "station_latitude",
  "station_longitude",
];

const promClientRegister = new Registry();

const stationCapacityGauge = new Gauge({
  name: "cabi_station_capacity",
  help: "Number of docks at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const docksAvailableGauge = new Gauge({
  name: "cabi_docks_available",
  help: "Number of open docks at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const ebikesAvailableGauge = new Gauge({
  name: "cabi_ebikes_available",
  help: "Number of ebikes available at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const classicBikesAvailableGauge = new Gauge({
  name: "cabi_classic_bikes_available",
  help: "Number of classic bikes available at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const disabledBikeGauge = new Gauge({
  name: "cabi_disabled_bikes",
  help: "Number of disabled bikes at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const disabledDockGauge = new Gauge({
  name: "cabi_disabled_docks",
  help: "Number of disabled docks at the station",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const isReturningGauge = new Gauge({
  name: "cabi_is_returning",
  help: "Whether the station is accepting bike returns",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});
const isRentingGauge = new Gauge({
  name: "cabi_is_renting",
  help: "Whether the station is renting bikes",
  labelNames: stationInformationLabels,
  registers: [promClientRegister],
});

const resetGauges = () => {
  stationCapacityGauge.reset();
  docksAvailableGauge.reset();
  ebikesAvailableGauge.reset();
  classicBikesAvailableGauge.reset();
  disabledBikeGauge.reset();
  disabledDockGauge.reset();
  isReturningGauge.reset();
  isRentingGauge.reset();
};

const updateStationMetrics = async () => {
  const statuses = await stationsStatuses();
  resetGauges();

  logger.info(`Updating station metrics with ${statuses.length} stations`);
  statuses.forEach((stationStatus) => {
    const labels = {
      station_name: stationStatus.name,
      station_region: stationStatus.region,
      station_id: stationStatus.station_id,
      station_latitude: stationStatus.latitude,
      station_longitude: stationStatus.longitude,
    };
    stationCapacityGauge.set(labels, stationStatus.capacity);
    docksAvailableGauge.set(labels, stationStatus.num_docks_available);
    ebikesAvailableGauge.set(labels, stationStatus.nun_ebikes_available);
    classicBikesAvailableGauge.set(
      labels,
      stationStatus.num_classic_bikes_available,
    );
    disabledBikeGauge.set(labels, stationStatus.num_bikes_disabled);
    disabledDockGauge.set(labels, stationStatus.num_docks_disabled);
    isReturningGauge.set(labels, stationStatus.is_returning);
    isRentingGauge.set(labels, stationStatus.is_renting);
  });
  logger.info(`Updated station metrics`);
};

const app = express();
const PORT = process.env.PORT ?? 9090;

const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
app.use(morgan("combined", { stream: morganStream }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.get("/metrics", async (_req: Request, res: Response) => {
  try {
    await updateStationMetrics();

    res.set("Content-Type", promClientRegister.contentType);
    res.end(await promClientRegister.metrics());
  } catch (error) {
    logger.error("Error serving metrics:", error);
    res.status(500).send("Error collecting metrics");
  }
});

app.listen(PORT, () => {
  logger.info(
    `Capital Bikeshare Prometheus exporter listening on port ${PORT}`,
  );
  logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
});
