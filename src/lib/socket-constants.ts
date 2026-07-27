/**
 * V3 Socket.IO rooms + events constants — remix_-the-yard
 * Production Completion Pack Part 1
 *
 * This app currently uses REST polling. These constants are ready for when
 * real-time notifications are added via Socket.IO.
 *
 * To enable: npm install socket.io socket.io-client  (in project root)
 * Then import { initSocket, ROOMS, EVENTS } from '@/lib/socket-constants'
 */

export const ROOMS = {
  user:          (id: string) => `user:${id}`,
  conversation:  (id: string) => `conversation:${id}`,
  group:         (id: string) => `group:${id}`,
  admin:         "admin",
  moderators:    "moderators",
  notifications: "notifications",
} as const;

export const EVENTS = {
  MESSAGE_NEW:       "message:new",
  MESSAGE_READ:      "message:read",
  MESSAGE_DELETED:   "message:deleted",
  TYPING_START:      "typing:start",
  TYPING_STOP:       "typing:stop",
  NOTIFICATION_NEW:  "notification:new",
  NOTIFICATION_READ: "notification:read",
  MATCH_NEW:         "match:new",
  MATCH_UPDATED:     "match:updated",
  LIKE_RECEIVED:     "like:received",
  FEED_UPDATE:       "feed:update",
  POST_NEW:          "post:new",
  USER_ONLINE:       "user:online",
  USER_OFFLINE:      "user:offline",
  ADMIN_UPDATE:      "admin:update",
  MODERATION_ACTION: "moderation:action",
  ERROR:             "error",
  RECONNECT:         "reconnect",
} as const;

export type RoomsFn = typeof ROOMS;
export type EventKeys = keyof typeof EVENTS;
export type EventValues = typeof EVENTS[EventKeys];
