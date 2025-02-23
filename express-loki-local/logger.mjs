import axios from 'axios';

class LoggerService {
  async log(level, message, metadata) {
    metadata.pod = 'loki-123';

    const lokiLogEntry = {
      streams: [
        {
          stream: {
            level,
            service_name: 'loki-demo'
          },
          values: [[`${Date.now() * 1000000}`, message, metadata]]
        }
      ]
    };
    try {
      await axios.post(`http://alloy:3100/loki/api/v1/push`, lokiLogEntry);
      console.log(`[${level.toUpperCase()}] ${message}`);
    } catch (error) {
      console.error('Error logging to Loki: ', error);
    }
  }

  fatal(payload) {
    const { message, ...metadata } = payload;
    this.log('fatal', message, metadata);
  }

  error(payload) {
    const { message, ...metadata } = payload;
    this.log('error', message, metadata);
  }

  warn(payload) {
    const { message, ...metadata } = payload;
    this.log('warn', message, metadata);
  }

  info(payload) {
    const { message, ...metadata } = payload;
    this.log('info', message, metadata);
  }

  debug(payload) {
    const { message, ...metadata } = payload;
    this.log('debug', message, metadata);
  }
}

export default new LoggerService();
