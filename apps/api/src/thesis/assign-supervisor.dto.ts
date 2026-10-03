//ملف تعريف البيانات المدخلة عند تعيين المشرف (مثل معرف الرسالة، معرف المشرف، نوع الإشراف رئيسي أم مشارك، وسبب التعديل إن وجد).
export enum SupervisorRole {
  MAIN = 'MAIN',
  CO_SUPERVISOR = 'CO_SUPERVISOR',
}

export class AssignSupervisorDto {
  thesisId!: string;
  supervisorUserId!: string;
  role!: SupervisorRole;
  changeReason?: string;
  approvedByUserId?: string;
}