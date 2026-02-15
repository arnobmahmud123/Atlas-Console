import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

export async function submitKyc(params: {
  userId: string;
  documentType: 'PASSPORT' | 'NID' | 'DRIVING_LICENSE';
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
}) {
  const kyc = await prisma.kyc.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      document_type: params.documentType,
      document_front_url: params.documentFrontUrl,
      document_back_url: params.documentBackUrl,
      selfie_url: params.selfieUrl,
      status: 'PENDING'
    }
  });

  return { ok: true, kycId: kyc.id };
}
