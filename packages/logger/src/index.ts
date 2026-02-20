type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  level?: LogLevel;
  context: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(configLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[messageLevel] >= LOG_LEVEL_PRIORITY[configLevel];
}

function parseLogLevel(level: string): LogLevel {
  const normalized = level.toLowerCase();
  if (normalized === "debug" || normalized === "info" || normalized === "warn" || normalized === "error") {
    return normalized as LogLevel;
  }
  return "info"; // Default fallback
}

function getLogLevel(): LogLevel {
  // Check for window.LOG_LEVEL (browser)
  if (typeof window !== "undefined" && (window as any).LOG_LEVEL) {
    return parseLogLevel((window as any).LOG_LEVEL);
  }
  // Check for process.env.LOG_LEVEL (Node.js)
  if (typeof process !== "undefined" && process.env && process.env.LOG_LEVEL) {
    return parseLogLevel(process.env.LOG_LEVEL);
  }
  // Default to info
  return "info";
}

function isNodeEnvironment(): boolean {
  return typeof process !== "undefined" && 
         process.stdout !== undefined && 
         process.stderr !== undefined;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level || getLogLevel(),
      context: config.context,
    };
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.config.context}]`;
    return prefix + (meta && meta.length > 0 ? ` ${message} ${JSON.stringify(meta)}` : ` ${message}`);
  }

  private writeOutput(level: LogLevel, formatted: string): void {
    if (isNodeEnvironment()) {
      // Node.js: route to stderr for error/warn, stdout for info/debug
      if (level === "error" || level === "warn") {
        process.stderr.write(formatted + "\n");
      } else {
        process.stdout.write(formatted + "\n");
      }
    } else {
      // Browser: use console methods
      if (level === "error") {
        console.error(formatted);
      } else if (level === "warn") {
        console.warn(formatted);
      } else if (level === "info") {
        console.info(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  debug(message: string, ...meta: unknown[]): void {
    if (shouldLog(this.config.level!, "debug")) {
      const formatted = this.formatMessage("debug", message, meta);
      this.writeOutput("debug", formatted);
    }
  }

  info(message: string, ...meta: unknown[]): void {
    if (shouldLog(this.config.level!, "info")) {
      const formatted = this.formatMessage("info", message, meta);
      this.writeOutput("info", formatted);
    }
  }

  warn(message: string, ...meta: unknown[]): void {
    if (shouldLog(this.config.level!, "warn")) {
      const formatted = this.formatMessage("warn", message, meta);
      this.writeOutput("warn", formatted);
    }
  }

  error(message: string, ...meta: unknown[]): void {
    if (shouldLog(this.config.level!, "error")) {
      const formatted = this.formatMessage("error", message, meta);
      this.writeOutput("error", formatted);
    }
  }
}

export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

// Also export getLogger for backward compatibility with simple usage
const loggers = new Map<string, Logger>();

export function getLogger(context: string): Logger {
  if (!loggers.has(context)) {
    loggers.set(context, new Logger({ context }));
  }
  return loggers.get(context)!;
}

export type { LogLevel, LoggerConfig };
export { Logger };
