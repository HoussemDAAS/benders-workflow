const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    // Use relative path from the server directory, not absolute paths
    this.dbPath = this.resolveDbPath();
    this.init();
  }

  resolveDbPath() {
    // Get DB_PATH from environment variable
    const envDbPath = process.env.DB_PATH;
    
    if (!envDbPath) {
      throw new Error('DB_PATH environment variable is required. Please set it in your .env file.');
    }

    // If it's already an absolute path, use it as is (for production)
    if (path.isAbsolute(envDbPath)) {
      return envDbPath;
    }

    // For relative paths, resolve from the server root directory
    // Find the server root by looking for package.json with server dependencies
    let currentDir = __dirname;
    let serverRoot = null;

    // Walk up the directory tree to find the server root
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          // Check if this is our server package.json by looking for specific dependencies
          if (packageJson.dependencies && (packageJson.dependencies.express || packageJson.dependencies.sqlite3)) {
            serverRoot = currentDir;
            break;
          }
        } catch (error) {
          // Continue searching if package.json is malformed
        }
      }
      currentDir = path.dirname(currentDir);
    }

    if (!serverRoot) {
      // Fallback: assume we're in the server directory structure
      // Go up from config directory to server root
      serverRoot = path.resolve(__dirname, '..');
    }

    // Resolve the database path relative to server root
    const resolvedPath = path.resolve(serverRoot, envDbPath);
    
    console.log(`📍 Database path resolved: ${resolvedPath}`);
    return resolvedPath;
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Close any existing connection first
    if (this.db) {
      this.db.close();
    }

    console.log(`📍 Database path: ${this.dbPath}`);

    // Create database connection with proper settings
    this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
      }
      console.log(`Connected to SQLite database at ${this.dbPath}`);
      
      // Enable foreign keys and set busy timeout
      this.db.run('PRAGMA foreign_keys = ON');
      this.db.run('PRAGMA busy_timeout = 30000'); // 30 second timeout
      this.db.run('PRAGMA journal_mode = WAL'); // Better concurrency
    });
  }

  getConnection() {
    return this.db;
  }

  // Promisify database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Transaction support
  beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  commit() {
    return this.run('COMMIT');
  }

  rollback() {
    return this.run('ROLLBACK');
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    });
  }
}

// Singleton instance
let dbInstance = null;

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
};

module.exports = {
  Database,
  getDatabase
};