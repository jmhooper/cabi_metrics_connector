This repository provides a Prometheus metric connector for the Capital Bikeshare station status data. This uses the [Capital Bikeshare Real-Time System Data](https://capitalbikeshare.com/system-data).

# Metrics

The following metrics are provided:

- `cabi_station_capacity`: The total capacity for a station
- `cabi_docks_available`: The number of open docks at a station
- `cabi_ebikes_available`: The number of eBikes available at station
- `cabi_classic_bikes_available`: The number of classic bikes at a station
- `cabi_disabled_bikes`: The number of disabled bikes at a station
- `cabi_disabled_docks`: The number of disabled docks at a station
- `cabi_is_returning`: `1` or `0` depending on whether the staiton is currently returning
- `cabi_is_renting`: `1` or `0` depending on whther the staiton is currently retning

# Running

You can start the connector using docker:

```
docker run -p 9090:9090 jmhooper/cabi-metrics-collector
```

Alternatively you can use docker compose:

```yaml
services:
  cabi-metrics-collector:
    image: jmhooper/cabi-metrics-collector
    container_name: cabi-metrics-collector
    restart: unless-stopped
    ports:
      - "9090:9090"
```
