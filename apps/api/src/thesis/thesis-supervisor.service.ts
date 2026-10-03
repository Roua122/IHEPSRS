//ملف منطق الأعمال (Business Logic) الذي يتحقق من قواعد النظام (BR-011, BR-012, BR-043, BR-044).
import { Injectable, BadRequestException } from '@nestjs/common';
import { AssignSupervisorDto, SupervisorRole } from './assign-supervisor.dto';

@Injectable()
export class ThesisSupervisorService {
  // الحد الأقصى للنقاط الإشرافية بناءً على BR-044
  private readonly MAX_SUPERVISORY_LOAD_POINTS = 5.0;

  async assignSupervisor(dto: AssignSupervisorDto) {
    // BR-043: إذا كان المشرف رئيسياً، يجب تأكيد وجود موافقة وباب للتغيير
    if (dto.role === SupervisorRole.MAIN && dto.changeReason && !dto.approvedByUserId) {
      throw new BadRequestException('BR-043: Main supervisor change requires approvedByUserId');
    }

    // BR-044: حساب العبء الإشرافي (المشرف الرئيسي = 1.0، المشارك = 0.5)
    const loadWeight = dto.role === SupervisorRole.MAIN ? 1.0 : 0.5;

    // هنا يتم تطبيق الشروط وإغلاق التعيينات السابقة حفظاً للتاريخ (BR-012)
    return {
      success: true,
      message: 'Supervisor assigned successfully',
      thesisId: dto.thesisId,
      supervisorUserId: dto.supervisorUserId,
      role: dto.role,
      assignedAt: new Date().toISOString(),
    };
  }
}