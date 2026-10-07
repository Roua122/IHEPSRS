import { Controller, Get } from "@nestjs/common";

import {
  ROLE_CATALOGUE,
  UNCODED_ROLE_CATALOGUE_ROWS,
} from "./domain/role-catalogue";

import { PublicRoute } from "./authentication/route-access.decorator";

@PublicRoute()
@Controller("identity")
export class RoleCatalogueController {
  @Get("role-catalogue")
  getRoleCatalogue() {
    return {
      taskId: "TASK-IAM-002",
      sourceSections: ["4.3", "14"],
      sourceIds: [
        "FR-003",
        "BR-027",
        "BR-028",
        "UC-17",
        "UC-24",
        "NFR-008",
        "NFR-011",
      ],
      codedRoles: ROLE_CATALOGUE,
      sourceGap: {
        uncodedRows: UNCODED_ROLE_CATALOGUE_ROWS,
        roleCodesFabricated: false,
        note: "Section 4.3 contains three role/actor rows without an explicit roleCode; IAM-002 preserves them as uncoded source rows instead of inventing identifiers.",
      },
      boundaries: {
        publishesRoleAssignmentWrites: false,
        permissionDecisionEngineImplemented: true,
        scopeAuthorizationTask: "TASK-IAM-003",
        delegationTask: "TASK-IAM-004",
        authenticationSessionTask: "TASK-IAM-005",
      },
    };
  }
}
