import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import type { ThesisSupervisorRole } from "@ihepsrs/contracts";

export class AssignSupervisorDto {
  @IsString()
  @IsNotEmpty()
  researcherId!: string;

  @IsIn(["MAIN", "CO_SUPERVISOR"])
  role!: ThesisSupervisorRole;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  changeReason?: string;

  @IsString()
  @IsNotEmpty()
  approvedByUserId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  approvalDecisionId?: string;
}

export class EndSupervisorAssignmentDto {
  @IsDateString()
  endDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  changeReason!: string;

  @IsString()
  @IsNotEmpty()
  approvedByUserId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  approvalDecisionId?: string;
}

export class CheckSupervisorEligibilityDto {
  @IsString()
  @IsNotEmpty()
  researcherId!: string;

  @IsIn(["MAIN", "CO_SUPERVISOR"])
  role!: ThesisSupervisorRole;

  @IsDateString()
  startDate!: string;
}
