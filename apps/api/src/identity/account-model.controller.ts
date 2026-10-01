import { Controller, Get } from "@nestjs/common";

import { USER_STATUSES, USER_STATUS_TRANSITIONS } from "./domain/user-status";

@Controller("identity")
export class AccountModelController {
  @Get("account-model")
  getAccountModel() {
    return {
      taskId: "TASK-IAM-001",
      sourceIds: ["FR-001", "BR-040", "BR-055", "UC-01", "UC-19", "NFR-008"],
      userAccount: {
        fields: [
          "userId",
          "personId",
          "username",
          "status",
          "mfaRequired",
          "lastLoginAt",
        ],
        statuses: USER_STATUSES,
        transitions: USER_STATUS_TRANSITIONS,
      },
      person: {
        fields: [
          "personId",
          "nationalIdentifier",
          "fullNameAr",
          "fullNameEn",
          "birthDate",
          "email",
          "mobile",
          "status",
        ],
        sensitiveFields: ["nationalIdentifier"],
        identityRoot: true,
      },
      boundaries: {
        publishesSensitiveWriteEndpoints: false,
        roleCatalogueTask: "TASK-IAM-002",
        scopeAuthorizationTask: "TASK-IAM-003",
        delegationTask: "TASK-IAM-004",
        authenticationSessionTask: "TASK-IAM-005",
      },
    };
  }
}
