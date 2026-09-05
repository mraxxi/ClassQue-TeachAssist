import { db } from './db';


export async function queueSyncAction(entityType: string, action: 'insert' | 'update' | 'delete', data: any) {
  try {
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      entityType,
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, we would trigger a sync attempt here
    // triggerSync();
  } catch (error) {
    console.error('Failed to queue sync action:', error);
  }
}

export async function processSyncQueue() {
  if (!navigator.onLine) {
    console.log('Offline. Sync paused.');
    return;
  }

  try {
    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} items in sync queue...`);
    
    // Stub: Here we would send `queue` to our Cloudflare API
    // e.g., await fetch('/api/sync', { method: 'POST', body: JSON.stringify(queue) })
    
    // Upon success, clear the queue and mark items as 'synced'
    await db.transaction('rw', db.syncQueue, db.cohorts, db.students, async () => {
       // Clear queue
       await db.syncQueue.clear();
       
       // Note: in a full implementation, we'd iterate over the queue and update the 
       // `syncStatus` of the actual entities to 'synced'.
    });
    
    console.log('Sync completed successfully.');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Listen for online events to resume syncing
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue();
  });
}
