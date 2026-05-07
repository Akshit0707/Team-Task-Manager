import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLog = (level, data) => {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    ...data,
  });
};

const logger = {
  info: (data) => {
    const log = formatLog('INFO', data);
    console.log(log);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'info.log'),
        log + '\n'
      );
    }
  },

  error: (data) => {
    const log = formatLog('ERROR', data);
    console.error(log);
    
    fs.appendFileSync(
      path.join(logsDir, 'error.log'),
      log + '\n'
    );
  },

  warn: (data) => {
    const log = formatLog('WARN', data);
    console.warn(log);
    
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'warn.log'),
        log + '\n'
      );
    }
  },

  debug: (data) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('DEBUG', data);
      console.log(log);
    }
  },
};

export default logger;