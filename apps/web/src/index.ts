import { ScanOrchestrator } from '@voom-nexus/core';
import { logger } from '@voom-nexus/shared';
import { VoomWebServer } from './server/server.js';
import { defaultDataStore, MemoryDataStore } from './store/data-store.js';

export * from './store/data-store.js';
export * from './server/server.js';
export * from './server/router.js';
export * from './ui/dashboard.js';

export interface WebPlatformStatus {
  service: string;
  version: string;
  status: 'ONLINE' | 'MAINTENANCE' | 'INITIALIZING';
  sharedEngineVersion: string;
}

export class WebPlatformService {
  private orchestrator: ScanOrchestrator;
  private server: VoomWebServer;
  private store: MemoryDataStore;

  constructor(store: MemoryDataStore = defaultDataStore) {
    this.store = store;
    this.orchestrator = new ScanOrchestrator();
    this.server = new VoomWebServer(this.store);
  }

  getStatus(): WebPlatformStatus {
    return {
      service: 'Voom Nexus Web & API Platform',
      version: '0.1.0-alpha.0',
      status: 'ONLINE',
      sharedEngineVersion: '0.1.0-alpha.0'
    };
  }

  getOrchestrator(): ScanOrchestrator {
    return this.orchestrator;
  }

  getServer(): VoomWebServer {
    return this.server;
  }

  getStore(): MemoryDataStore {
    return this.store;
  }
}

export const webPlatformService = new WebPlatformService();
logger.info('Initialized Voom Nexus Web Application platform');

// Direct CLI start check
const isMain = process.argv[1]?.includes('apps/web/dist/index.js');
if (isMain) {
  const port = parseInt(process.env.PORT || '4000', 10);
  webPlatformService.getServer().start(port).then((actualPort) => {
    console.log(`\n====================================================`);
    console.log(`  VOOM NEXUS — WEB DASHBOARD & REST API RUNNING     `);
    console.log(`====================================================`);
    console.log(`  Dashboard UI:   http://localhost:${actualPort}`);
    console.log(`  REST API Root:  http://localhost:${actualPort}/api/v1/health`);
    console.log(`  Projects API:   http://localhost:${actualPort}/api/v1/projects`);
    console.log(`====================================================\n`);
  }).catch((err) => {
    logger.error('Failed to start Voom Nexus Web Server', err);
    process.exit(1);
  });
}
