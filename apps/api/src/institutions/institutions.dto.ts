import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  institutionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nameAr!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nameEn?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsIn(["Active", "Inactive"])
  status!: "Active" | "Inactive";

  @IsOptional()
  @IsObject()
  externalRefs?: Record<string, string>;
}

export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsObject()
  externalRefs?: Record<string, string>;
}

export class ChangeInstitutionStatusDto {
  @IsIn(["Active", "Inactive"])
  status!: "Active" | "Inactive";
}

export class CreateOrgUnitDto {
  @IsString()
  @IsNotEmpty()
  orgUnitId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentOrgUnitId?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nameAr!: string;

  @IsIn(["Active", "Inactive", "Archived"])
  status!: "Active" | "Inactive" | "Archived";

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class CreateAcademicProgramDto {
  @IsString()
  @IsNotEmpty()
  programId!: string;

  @IsString()
  @IsNotEmpty()
  orgUnitId!: string;

  @IsIn(["Diploma", "Master", "PhD"])
  degreeLevel!: "Diploma" | "Master" | "PhD";

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nameAr!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  specializationCode?: string;

  @IsIn(["Draft", "Active", "Suspended", "Retired", "Archived"])
  status!: "Draft" | "Active" | "Suspended" | "Retired" | "Archived";

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsBoolean()
  thesisRequired!: boolean;

  @IsInt()
  @Min(1)
  versionNo!: number;
}

export class CheckProgramEligibilityDto {
  @IsDateString()
  enrollmentDate!: string;
}

export class CreateReferenceVersionDto {
  @IsString()
  @IsNotEmpty()
  referenceType!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsInt()
  @Min(1)
  versionNo!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class RetireReferenceDto {
  @IsDateString()
  effectiveTo!: string;
}

export class CreatePolicyVersionDto {
  @IsString()
  @IsNotEmpty()
  policyKey!: string;

  @IsIn(["Central", "Institution", "Program", "Cohort"])
  scopeType!: "Central" | "Institution" | "Program" | "Cohort";

  @IsString()
  @IsNotEmpty()
  scopeId!: string;

  @IsDefined()
  value!: unknown;

  @IsInt()
  @Min(1)
  versionNo!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsString()
  @IsNotEmpty()
  approvedByUserId!: string;

  @IsIn(["Draft", "Approved"])
  status!: "Draft" | "Approved";
}

export class RetirePolicyVersionDto {
  @IsDateString()
  effectiveTo!: string;
}
