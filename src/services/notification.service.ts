import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

export async function sendNotification(
  userId: string | null,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
  title: string,
  message: string,
  options?: { href?: string | null; attachmentUrl?: string | null }
) {
  return prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId ?? undefined,
      type,
      title,
      message,
      href: options?.href ?? undefined,
      attachment_url: options?.attachmentUrl ?? undefined
    }
  });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });
}
