import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // TASK-RPT-003: FR-032 / FR-033 Basic Dashboard Endpoint
  @Get('dashboard')
  async getDashboard(
    @Query('institutionId') institutionId?: string,
    @Query('period') period?: string,
  ) {
    return this.reportingService.getDashboardSummary(institutionId, period);
  }

  // TASK-RPT-004: FR-033 / FR-039 Export Controls Endpoint
  @Get('export')
  async exportReports(
    @Query('institutionId') institutionId?: string,
    @Query('format') format?: string,
  ) {
    return this.reportingService.exportData(institutionId, format);
  }
}
