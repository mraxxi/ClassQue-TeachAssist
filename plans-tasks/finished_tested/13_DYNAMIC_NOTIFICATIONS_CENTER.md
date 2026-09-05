# 📋 Stage 13: Functional Notifications Center & Pedagogical Alerts

**Lifecycle Stage**: `working_on`  
**Target Domain**: Navigation Header (`src/components/layout/NotificationsPopover.tsx`) & Store State  
**Ubiquitous Language**: `Notification Center` (Pusat Notifikasi & Pengingat), `Pedagogical Alert` (Peringatan Pembelajaran)

---

## 🎯 Objectives & Deliverables
Replace the static notification bell in `SideNav.tsx` with a fully functional Notification Center that computes dynamic pedagogical alerts (class proximity, pending tasks, unsubmitted claims), displays unread badges, and provides an interactive popover.

### 1. Notification Models & Store Actions
- [ ] In `src/types/index.ts`:
  - Add `NotificationItem`:
    ```ts
    export interface NotificationItem {
      id: string;
      category: 'schedule' | 'task' | 'claim' | 'attendance';
      title: string;
      message: string;
      timestamp: string;
      isRead: boolean;
      actionTab?: 'cockpit' | 'classes-students' | 'lesson-planner' | 'claims-reports';
    }
    ```
- [ ] In `src/store/useTeacherStore.ts`:
  - `notifications: NotificationItem[]`
  - `markNotificationAsRead: (id: string) => void`
  - `markAllNotificationsAsRead: () => void`
  - `clearNotifications: () => void`
  - Dynamic generator combining upcoming classes today, tasks due today, and draft claims.

### 2. Notifications Popover Component (`NotificationsPopover.tsx`)
- [ ] Clicking Bell in `SideNav.tsx` toggles popover.
- [ ] Unread badge counter (`notifications.filter(n => !n.isRead).length`).
- [ ] Itemized alerts list with category icons and relative timestamps (e.g. `10m ago`).
- [ ] 1-Click "Mark all as read" button.
- [ ] Clicking an alert marks it read and navigates directly to the relevant hub tab.

---

## 🧪 Verification & Testing Checklist
- [ ] Verify Bell icon displays accurate unread counter badge.
- [ ] Click Bell icon, verify notifications popover opens and positions correctly.
- [ ] Click "Mark All as Read", verify unread badge disappears.
- [ ] Click a task notification, verify navigation to the cockpit or claims tab.
