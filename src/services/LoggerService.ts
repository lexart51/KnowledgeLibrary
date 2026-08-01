export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_RANK: Record<LogLevel, number> = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };

export class LoggerService {
  constructor(private level: LogLevel = "WARN", private readonly production = process.env.NODE_ENV === "production") {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, context?: unknown): void {
    this.write("DEBUG", message, context);
  }

  info(message: string, context?: unknown): void {
    this.write("INFO", message, context);
  }

  warn(message: string, context?: unknown): void {
    this.write("WARN", message, context);
  }

  error(message: string, context?: unknown): void {
    this.write("ERROR", message, context);
  }

  shouldLog(level: LogLevel): boolean {
    if (this.production && level === "DEBUG") return false;
    return LEVEL_RANK[level] >= LEVEL_RANK[this.level];
  }

  private write(level: LogLevel, message: string, context?: unknown): void {
    if (!this.shouldLog(level)) return;
    const payload = context === undefined ? [message] : [message, context];
    if (level === "ERROR") console.error("[KnowledgeLibrary]", ...payload);
    else if (level === "WARN") console.warn("[KnowledgeLibrary]", ...payload);
    else if (!this.production) console.info("[KnowledgeLibrary]", ...payload);
  }
}
