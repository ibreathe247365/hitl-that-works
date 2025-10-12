import type { NextRequest } from "next/server";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  stateId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isDebugEnabled = process.env.DEBUG_LOGGING === "true" || this.isDevelopment;

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    let logString = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logString += ` | Error: ${error.name}: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        logString += ` | Stack: ${error.stack}`;
      }
    }
    
    return logString;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    const formattedLog = this.formatLog(entry);

    // Use appropriate console method based on level
    switch (level) {
      case "debug":
        if (this.isDebugEnabled) {
          console.debug(formattedLog);
        }
        break;
      case "info":
        console.info(formattedLog);
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "error":
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log("error", message, context, error);
  }

  // Request-specific logging methods
  logRequestStart(request: NextRequest, context?: LogContext): LogContext {
    const requestId = this.generateRequestId();
    const requestContext: LogContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: request.headers.get("x-forwarded-for") || 
          request.headers.get("x-real-ip") || 
          "unknown",
      ...context,
    };

    this.info("Request started", requestContext);
    return requestContext;
  }

  logRequestEnd(requestContext: LogContext, statusCode: number, duration?: number): void {
    const endContext = {
      ...requestContext,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    };

    const level = statusCode >= 400 ? "error" : statusCode >= 300 ? "warn" : "info";
    this.log(level, "Request completed", endContext);
  }

  logValidationError(context: LogContext, field: string, value: any, reason: string): void {
    this.warn("Validation error", {
      ...context,
      validationError: {
        field,
        value,
        reason,
      },
    });
  }

  logDatabaseOperation(context: LogContext, operation: string, table?: string, recordId?: string): void {
    this.debug("Database operation", {
      ...context,
      databaseOperation: {
        operation,
        table,
        recordId,
      },
    });
  }

  logExternalApiCall(context: LogContext, url: string, method: string, statusCode?: number, duration?: number): void {
    this.info("External API call", {
      ...context,
      externalApi: {
        url,
        method,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
      },
    });
  }

  logWebhookEvent(context: LogContext, eventType: string, payloadType?: string, stateId?: string): void {
    this.info("Webhook event", {
      ...context,
      webhookEvent: {
        eventType,
        payloadType,
        stateId,
      },
    });
  }

  logQueueOperation(context: LogContext, operation: string, jobId?: string, queueName?: string): void {
    this.info("Queue operation", {
      ...context,
      queueOperation: {
        operation,
        jobId,
        queueName,
      },
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to extract context from request
export const extractRequestContext = (request: NextRequest): LogContext => {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") || 
        request.headers.get("x-real-ip") || 
        "unknown",
  };
};

// Helper function to measure execution time
export const measureExecutionTime = async <T>(
  operation: () => Promise<T>,
  context: LogContext,
  operationName: string
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    logger.debug(`${operationName} completed`, {
      ...context,
      duration: `${duration}ms`,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operationName} failed`, {
      ...context,
      duration: `${duration}ms`,
    }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
