import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, FeeRecord, ServiceRating } from '@/types';
import { notifications, feeRecords, serviceRatings } from '@/data/mockData';

interface NotificationState {
  notifications: Notification[];
  feeRecords: FeeRecord[];
  serviceRatings: ServiceRating[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  confirmFee: (id: string) => void;
  disputeFee: (id: string, reason: string) => void;
  addRating: (rating: ServiceRating) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications,
      feeRecords,
      serviceRatings,
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      confirmFee: (id) =>
        set((state) => ({
          feeRecords: state.feeRecords.map((f) => (f.id === id ? { ...f, status: 'confirmed' as const } : f)),
        })),
      disputeFee: (id, reason) =>
        set((state) => ({
          feeRecords: state.feeRecords.map((f) => (f.id === id ? { ...f, status: 'disputed' as const, disputeReason: reason } : f)),
        })),
      addRating: (rating) =>
        set((state) => ({
          serviceRatings: [...state.serviceRatings, rating],
        })),
      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    { name: 'telemedicine-notification' }
  )
);
