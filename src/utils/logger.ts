import { environment, getPreferenceValues } from "@raycast/api";
import { appendFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { TranscriptionPreferences } from "../types";

// 日志级别
export enum LogLevel {
  TRACE = "TRACE",
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// 日志级别优先级
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
};

// 日志配置
interface LoggerConfig {
  level: LogLevel;
  logToFile: boolean;
  logToConsole: boolean;
  maxFileSize: number; // 最大文件大小（字节）
  maxFiles: number; // 保留的日志文件数量
}

class Logger {
  private config: LoggerConfig;
  private logDir: string;
  private currentLogFile: string;
  private sessionId: string;

  constructor() {
    // 生成会话ID
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 设置日志目录为项目根目录
    this.logDir = join(homedir(), "Dev/Python/speech-to-text");

    // 设置固定的日志文件名
    this.currentLogFile = join(this.logDir, "speech-to-text-debug.log");

    // 删除旧的日志文件（如果存在）
    if (existsSync(this.currentLogFile)) {
      try {
        unlinkSync(this.currentLogFile);
      } catch (error) {
        console.error("Failed to delete old log file:", error);
      }
    }

    // 从用户preference获取配置
    this.config = this.loadLoggerConfig();

    // 只有在启用日志时才记录启动信息
    if (this.config.logToFile || this.config.logToConsole) {
      this.info("=".repeat(80));
      this.info(`Speech to Text Plugin Started - Session: ${this.sessionId}`);
      this.info(`Environment: ${environment.isDevelopment ? "Development" : "Production"}`);
      this.info(`Logging Enabled: ${this.shouldLogAnything()}`);
      this.info(`Log Level: ${this.config.level}`);
      this.info(`Log to File: ${this.config.logToFile}`);
      this.info(`Log to Console: ${this.config.logToConsole}`);
      this.info(`Log File: ${this.currentLogFile}`);
      this.info("=".repeat(80));
    }
  }

  private loadLoggerConfig(): LoggerConfig {
    try {
      const prefs = getPreferenceValues<TranscriptionPreferences>();

      // 智능默认值：开发环境默认开启，生产环境默认关闭
      const isDevelopment = environment.isDevelopment;

      return {
        level: (prefs.logLevel as LogLevel) || (isDevelopment ? LogLevel.TRACE : LogLevel.INFO),
        logToFile: prefs.logToFile !== undefined ? prefs.logToFile : true,
        logToConsole: prefs.logToConsole !== undefined ? prefs.logToConsole : isDevelopment,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 1,
      };
    } catch (error) {
      // 如果无法获取preferences，使用保守的默认值
      console.warn("Failed to load logger preferences, using defaults:", error);
      return {
        level: environment.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
        logToFile: true,
        logToConsole: environment.isDevelopment,
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 1,
      };
    }
  }

  private shouldLogAnything(): boolean {
    try {
      const prefs = getPreferenceValues<TranscriptionPreferences>();
      return prefs.enableLogging !== false; // 默认启用，除非用户明确禁用
    } catch (error) {
      // 如果无法获取preferences，在开发环境下启用，生产环境下禁用
      return environment.isDevelopment;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    component: string,
    message: string,
    data?: unknown
  ): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level}] [${this.sessionId}] [${component}] ${message}${dataStr}`;
  }

  private writeToFile(message: string): void {
    if (!this.config.logToFile) return;

    try {
      // 直接追加到文件，不检查大小（因为每次启动都会清空）
      appendFileSync(this.currentLogFile, message + "\n");
    } catch (error) {
      console.error("Failed to write log to file:", error);
    }
  }

  // 不再需要日志轮转功能
  private rotateLogFile(): void {
    // 功能已禁用
  }

  private cleanOldLogs(): void {
    // 功能已禁用
  }

  private log(level: LogLevel, component: string, message: string, data?: unknown): void {
    // 首先检查是否全局启用日志
    if (!this.shouldLogAnything()) return;

    // 然后检查日志级别
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, component, message, data);

    // 输出到控制台
    if (this.config.logToConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // 写入文件
    this.writeToFile(formattedMessage);
  }

  // 公共日志方法
  trace(component: string, message: string, data?: unknown): void {
    this.log(LogLevel.TRACE, component, message, data);
  }

  debug(component: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  info(component: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, component, message, data);
  }

  warn(component: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, component, message, data);
  }

  error(component: string, message: string, error?: unknown): void {
    const errorData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

    this.log(LogLevel.ERROR, component, message, errorData);
  }

  // 性能追踪
  startTimer(component: string, operation: string): () => void {
    if (!this.shouldLogAnything()) {
      // 如果日志被禁用，返回空函数
      return () => {};
    }

    const start = Date.now();
    this.trace(component, `Starting operation: ${operation}`);

    return () => {
      const duration = Date.now() - start;
      this.trace(component, `Completed operation: ${operation}`, { duration: `${duration}ms` });
    };
  }

  // 获取日志文件路径
  getLogFilePath(): string {
    return this.currentLogFile;
  }

  // 获取所有日志文件（现在只有一个）
  getLogFiles(): string[] {
    if (existsSync(this.currentLogFile)) {
      return [this.currentLogFile];
    }
    return [];
  }

  // 重新加载配置（当用户更改preferences时调用）
  reloadConfig(): void {
    this.config = this.loadLoggerConfig();
    this.info("Logger", "Configuration reloaded", {
      level: this.config.level,
      logToFile: this.config.logToFile,
      logToConsole: this.config.logToConsole,
      loggingEnabled: this.shouldLogAnything(),
    });
  }

  // 获取当前配置状态
  getConfig(): LoggerConfig & { enabled: boolean } {
    return {
      ...this.config,
      enabled: this.shouldLogAnything(),
    };
  }
}

// 导出单例
export const logger = new Logger();

// 导出便捷函数
export const trace = (component: string, message: string, data?: unknown) =>
  logger.trace(component, message, data);
export const debug = (component: string, message: string, data?: unknown) =>
  logger.debug(component, message, data);
export const info = (component: string, message: string, data?: unknown) =>
  logger.info(component, message, data);
export const warn = (component: string, message: string, data?: unknown) =>
  logger.warn(component, message, data);
export const error = (component: string, message: string, error?: unknown) =>
  logger.error(component, message, error);
export const startTimer = (component: string, operation: string) =>
  logger.startTimer(component, operation);
export const reloadLoggerConfig = () => logger.reloadConfig();
export const getLoggerConfig = () => logger.getConfig();
