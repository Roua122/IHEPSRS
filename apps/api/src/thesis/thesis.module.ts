import { Module } from '@nestjs/common';
import { ThesisSupervisorController } from './thesis-supervisor.controller';
import { ThesisSupervisorService } from './thesis-supervisor.service';

@Module({
  controllers: [ThesisSupervisorController],
  providers: [ThesisSupervisorService],
  exports: [ThesisSupervisorService],
})
export class ThesisModule {}