import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IntegrationAttempt, IntegrationOutcome } from './integration-attempt.entity';

@Injectable()
export class IntegrationService {
  private attempts: IntegrationAttempt[] = [];

  // تسجيل محاولة تكامل جديدة
  logAttempt(
    attemptData: Partial<IntegrationAttempt>,
  ): IntegrationAttempt {
    const attempt = {
      attemptId: attemptData.attemptId || randomUUID(),
      messageId: attemptData.messageId || '',
      attemptNo: attemptData.attemptNo || 1,
      startedAt: attemptData.startedAt || new Date(),
      endedAt: attemptData.endedAt,
      outcome: attemptData.outcome || 'PENDING',
      errorCode: attemptData.errorCode,
      workerId: attemptData.workerId,
      durationMs: attemptData.durationMs,
    } as IntegrationAttempt;

    this.attempts.push(attempt);
    return attempt;
  }

  // جلب محاولات التكامل المرتبطة بمعرف رسالة
  getAttemptsByMessage(messageId: string): IntegrationAttempt[] {
    return this.attempts.filter((attempt) => attempt.messageId === messageId);
  }

  // TASK-INT-006: التحقق من عدم تكرار الرسالة بناءً على معرف الرسالة أو (thesisId + version)
  checkIdempotency(thesisId: string, version: number): boolean {
    const uniqueKey = `${thesisId}_v${version}`;

    // التحقق هل تم تسجيل محاولة سابقة بنفس المفتاح بنجاح
    const existingAttempt = this.attempts.find(
      (attempt) =>
        attempt.messageId === uniqueKey &&
        attempt.outcome === IntegrationOutcome.SUCCEEDED,
    );

    return !!existingAttempt; // true إذا كانت المعالجة ناجحة سابقًا
  }

  // التوافق مع الاستدعاءات القديمة
  isDuplicate(thesisId: string, version: number): boolean {
    return this.checkIdempotency(thesisId, version);
  }

  // تحديد الإجراء المناسب عند فشل محاولة التكامل
  // 4. منطق فحص هل يجب إعادة المحاولة أم النقل للعزل
  processFailure(messageId: string, errorCode: string, attemptNo: number) {
    const maxRetries = 3;

    // في حال خطأ أمني -> فشل أمني مباشر
    if (errorCode.startsWith('SEC_')) {
      return {
        action: 'QUARANTINE',
        outcome: IntegrationOutcome.SECURITY_FAIL,
      };
    }

    // أخطاء دائمة -> نقل للعزل
    if (errorCode.startsWith('PERM_') || attemptNo >= maxRetries) {
      return {
        action: 'QUARANTINE',
        outcome: IntegrationOutcome.PERMANENT_FAIL,
      };
    }

    // أخطاء مؤقتة -> إعادة المحاولة
    return {
      action: 'RETRY',
      outcome: IntegrationOutcome.TRANSIENT_FAIL,
    };
  }


  // حساب مؤشرات محاولات التكامل
  getIntegrationMetrics(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    pendingAttempts: number;
    successRate: number;
  } {
    const totalAttempts = this.attempts.length;
    const successfulAttempts = this.attempts.filter(
      (attempt) => String(attempt.outcome).toUpperCase() === 'SUCCESS',
    ).length;
    const failedAttempts = this.attempts.filter(
      (attempt) => String(attempt.outcome).toUpperCase() === 'FAILED',
    ).length;
    const pendingAttempts = this.attempts.filter(
      (attempt) => String(attempt.outcome).toUpperCase() === 'PENDING',
    ).length;

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      pendingAttempts,
      successRate:
        totalAttempts === 0 ? 0 : (successfulAttempts / totalAttempts) * 100,
    };
  }
}

