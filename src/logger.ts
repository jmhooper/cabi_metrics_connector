import winston from "winston";
const { combine, simple, colorize } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(colorize(), simple()),
  transports: [new winston.transports.Console()],
});

export default logger;
