import { Controller, Get } from "@nestjs/common";
import type { StudentUpsertPayload } from "@ihepsrs/contracts";

@Controller("students")
export class StudentsController {
  @Get()
  list(): StudentUpsertPayload[] {
    return [
      {
        externalId: "UNI-A-ST-1001",
        studentNumber: "2026001",
        fullName: "طالب تجريبي",
        email: "student@example.edu",
        institutionId: "UNI-A",
      },
    ];
  }
}
