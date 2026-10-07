import { checkBandwidth } from '@/utils/network';

const DB_NAME = 'ProctorSnapshots';
const DB_VERSION = 1;
const SNAPSHOTS_STORE = 'snapshots';
const NETWORK_CHECK_INTERVAL = 5000;

export default class IndexDbBuffer {
  constructor(uploadFunctionMap, options = {}) {
    this.db = null;
    this.uploadFunctionMap = uploadFunctionMap;
    this.isUploading = false;
    this.options = {
      bucketCount: options.bucketCount || 10,
      maxSnapshotsPerBucket: options.maxSnapshotsPerBucket || 5,
      maxSnapshotsCount: options.maxSnapshotsCount || 50,
      networkCheckInterval:
        options.networkCheckInterval || NETWORK_CHECK_INTERVAL,
    };
    this.networkStatus = { isGood: true };
    this.networkMonitorInterval = null;
    this.currentSnapshotCount = 0;

    this.initDB().then(() => {
      this.startNetworkMonitoringAndProcessUploads();
    });
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
          const snapshotStore = db.createObjectStore(SNAPSHOTS_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          snapshotStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async performIntelligentCleanup() {
    try {
      const tx = this.db.transaction(SNAPSHOTS_STORE, 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE);
      const index = store.index('timestamp');

      this.currentSnapshotCount = await new Promise((resolve) => {
        const request = index.count();
        request.onsuccess = () => resolve(request.result);
      });

      if (this.currentSnapshotCount > this.options.maxSnapshotsCount) {
        const snapshotsToDelete = [];
        await new Promise((resolve) => {
          const request = index.openCursor();
          let count = 0;
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && count < this.options.bucketCount) {
              snapshotsToDelete.push(cursor.value.id);
              count += 1;
              cursor.advance(this.options.maxSnapshotsPerBucket);
            } else {
              resolve();
            }
          };
        });

        await Promise.all(
          snapshotsToDelete.map(
            (id) => new Promise((resolve, reject) => {
              const request = store.delete(id);
              request.onsuccess = resolve;
              request.onerror = reject;
            }),
          ),
        );
      }
    } catch (error) {
      console.error('Error during intelligent cleanup:', error);
    }
  }

  async addSnapshot(blob, type = 'screenshot') {
    const snapshot = {
      blob,
      timestamp: Date.now(),
      size: blob.size,
      type,
    };

    try {
      const tx = this.db.transaction(SNAPSHOTS_STORE, 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE);

      await new Promise((resolve, reject) => {
        const request = store.add(snapshot);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      await this.performIntelligentCleanup();
    } catch (error) {
      console.error('Error adding snapshot:', error);
      throw error;
    }
  }

  async processUploads() {
    if (this.isUploading || !this.networkStatus.isGood) return;

    this.isUploading = true;

    try {
      const tx = this.db.transaction(SNAPSHOTS_STORE, 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE);
      const index = store.index('timestamp');

      const UPLOAD_BATCH = Math.min(5, Math.max(2, this.currentSnapshotCount));

      const snapshots = await new Promise((resolve) => {
        const request = index.getAll(null, UPLOAD_BATCH);
        request.onsuccess = () => resolve(request.result);
      });

      if (snapshots.length > 0) {
        await Promise.all(
          snapshots.map(async (snapshot) => {
            try {
              const uploadFunction = this.uploadFunctionMap[snapshot.type];
              if (!uploadFunction) {
                throw new Error(
                  `No upload function found for type: ${snapshot.type}`,
                );
              }
              await uploadFunction({ blob: snapshot.blob });
              await new Promise((resolve, reject) => {
                const request = store.delete(snapshot.id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
              });
            } catch (error) {
              console.error('error', error);
              if (error.name === 'NetworkError') {
                this.networkStatus.isGood = false;
              }
            }
          }),
        );
      }
    } finally {
      this.isUploading = false;
    }
  }

  startNetworkMonitoringAndProcessUploads() {
    this.networkMonitorInterval = setInterval(async () => {
      try {
        const isSlowConnection = await checkBandwidth();
        this.networkStatus.isGood = !isSlowConnection;
        // this.networkStatus.isGood = false;
        this.processUploads();
      } catch (error) {
        this.networkStatus.isGood = false;
      }
    }, this.options.networkCheckInterval);
  }

  cleanup() {
    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }
  }

  updateUploadFunctions(newUploadFunctionMap) {
    this.uploadFunctionMap = {
      ...this.uploadFunctionMap,
      ...newUploadFunctionMap,
    };
  }
}

let instance = null;

export function getIndexDbBufferInstance(uploadFunctionMap, options = {}) {
  if (!instance) {
    instance = new IndexDbBuffer(uploadFunctionMap, options);
  } else if (uploadFunctionMap) {
    instance.updateUploadFunctions(uploadFunctionMap);
  }
  return instance;
}
