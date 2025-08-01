class Logger {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m'
    };
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    let logMessage = `${prefix} ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        logMessage += ` ${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += ` ${data}`;
      }
    }
    
    return logMessage;
  }

  info(message, data = null) {
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(`${this.colors.cyan}${formattedMessage}${this.colors.reset}`);
  }

  error(message, data = null) {
    const formattedMessage = this.formatMessage('error', message, data);
    console.error(`${this.colors.red}${formattedMessage}${this.colors.reset}`);
  }

  warn(message, data = null) {
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(`${this.colors.yellow}${formattedMessage}${this.colors.reset}`);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.log(`${this.colors.magenta}${formattedMessage}${this.colors.reset}`);
    }
  }

  success(message, data = null) {
    const formattedMessage = this.formatMessage('success', message, data);
    console.log(`${this.colors.green}${formattedMessage}${this.colors.reset}`);
  }
}

module.exports = { Logger };