import { Queue } from 'bullmq';
import { config } from './config';

export const emailQueue = new Queue('emails', { connection: config.redis });

export async function enqueue(emailId: string, runAt: Date, hourlyLimit: number) {
  await emailQueue.add(
    'send',
    { emailId, hourlyLimit },
    {
      jobId: emailId, // same id = never a duplicate job
      delay: Math.max(0, runAt.getTime() - Date.now()),
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
    }
  );
}