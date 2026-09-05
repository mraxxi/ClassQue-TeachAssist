import { db } from './db';
import { 
  initialCohorts, initialStudents, initialLessonPlans, 
  initialTasks, initialCefrMilestones, initialSessions, initialClaims 
} from '../store/seedData';
import type { 
  CohortEntity, StudentEntity, LessonPlanEntity, 
  TaskItemEntity, CefrMilestoneEntity, TeachingSessionEntity, TeachingClaimEntity 
} from './db';

export async function populateDemoData() {
  try {
    const timestamp = new Date().toISOString();
    const mapSyncMeta = (item: any) => ({ ...item, syncStatus: 'pending' as const, updatedAt: timestamp });

    // Only seed if empty
    if ((await db.cohorts.count()) === 0) {
      await db.cohorts.bulkAdd(initialCohorts.map(mapSyncMeta) as CohortEntity[]);
    }
    if ((await db.students.count()) === 0) {
      await db.students.bulkAdd(initialStudents.map(mapSyncMeta) as StudentEntity[]);
    }
    if ((await db.lessonPlans.count()) === 0) {
      await db.lessonPlans.bulkAdd(initialLessonPlans.map(mapSyncMeta) as LessonPlanEntity[]);
    }
    if ((await db.tasks.count()) === 0) {
      await db.tasks.bulkAdd(initialTasks.map(mapSyncMeta) as TaskItemEntity[]);
    }
    if ((await db.cefrMilestones.count()) === 0) {
      await db.cefrMilestones.bulkAdd(initialCefrMilestones.map(mapSyncMeta) as CefrMilestoneEntity[]);
    }
    if ((await db.teachingSessions.count()) === 0) {
      await db.teachingSessions.bulkAdd(initialSessions.map(mapSyncMeta) as TeachingSessionEntity[]);
    }
    if ((await db.teachingClaims.count()) === 0) {
      await db.teachingClaims.bulkAdd(initialClaims.map(mapSyncMeta) as TeachingClaimEntity[]);
    }
    
    console.log('Demo data populated successfully.');
  } catch (err) {
    console.error('Failed to populate demo data', err);
  }
}
