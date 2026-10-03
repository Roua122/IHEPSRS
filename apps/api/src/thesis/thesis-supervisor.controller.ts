//ملف الـ API Endpoint الذي يستقبل الطلبات ويطبق حماية الأمان والـ Scope المعتمدة في IAM003.
import { Controller, Post, Body } from '@nestjs/common';
import { ThesisSupervisorService } from './thesis-supervisor.service';
import { AssignSupervisorDto } from './assign-supervisor.dto';

@Controller('thesis/supervisors')
export class ThesisSupervisorController {
  constructor(private readonly supervisorService: ThesisSupervisorService) {}

  @Post('assign')
  async assignSupervisor(@Body() dto: AssignSupervisorDto) {
    return this.supervisorService.assignSupervisor(dto);
  }
}