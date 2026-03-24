import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export type NotificationType = 'info' | 'warning' | 'success';

export interface CreateNotificationParams {
  uid: string;
  title: string;
  message: string;
  type: NotificationType;
}

export const createNotification = async ({ uid, title, message, type }: CreateNotificationParams) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      uid,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
};
