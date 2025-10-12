# Logging Configuration

The application now includes comprehensive logging across all API routes. Here's how to configure and use it:

## Environment Variables

Add these to your `.env.local` file:

```bash
# Enable debug logging (shows more detailed logs)
DEBUG_LOGGING=true

# Log level (debug, info, warn, error)
LOG_LEVEL=info
```

## What Gets Logged

### Request Lifecycle
- Request start with method, URL, IP, user agent
- Request completion with status code and duration
- Request errors with full context

### Validation
- Field validation errors with specific field names and reasons
- Missing required fields
- Invalid data types

### Database Operations
- Convex queries and mutations
- Operation success/failure
- Record IDs and table names

### External API Calls
- Webhook requests and responses
- Queue operations (QStash)
- External service calls

### Webhook Events
- Webhook payload validation
- Processing status
- State ID tracking

## Log Format

Each log entry includes:
- Timestamp (ISO format)
- Log level (DEBUG, INFO, WARN, ERROR)
- Message
- Context (request ID, user ID, state ID, etc.)
- Error details (when applicable)

## Example Log Output

```
[2024-01-15T10:30:45.123Z] INFO: Request started | Context: {"requestId":"req_1705315845123_abc123","method":"POST","url":"/api/thread/send-message","ip":"192.168.1.1"}
[2024-01-15T10:30:45.125Z] DEBUG: Request body parsed | Context: {"requestId":"req_1705315845123_abc123","hasStateId":false,"hasMessage":true,"hasEmail":true,"messageLength":25}
[2024-01-15T10:30:45.200Z] INFO: User found | Context: {"requestId":"req_1705315845123_abc123","userId":"user_123","email":"user@example.com"}
[2024-01-15T10:30:45.300Z] INFO: Webhook sent successfully | Context: {"requestId":"req_1705315845123_abc123","stateId":"thread_1705315845300_def456","statusCode":202}
[2024-01-15T10:30:45.301Z] INFO: Request completed | Context: {"requestId":"req_1705315845123_abc123","statusCode":200,"duration":"178ms"}
```

## Debugging Failed Requests

When a request fails, you'll see:
1. The exact point of failure
2. Full error context including stack traces (in development)
3. Request duration and status code
4. All relevant IDs for tracking

## Performance Monitoring

The logging includes execution time measurements for:
- Database operations
- External API calls
- Request processing
- Individual operations

This helps identify performance bottlenecks and slow operations.
