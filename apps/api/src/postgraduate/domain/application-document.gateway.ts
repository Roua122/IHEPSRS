import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";

/**
 * FR-029 / BR-057 / NFR-022 / NFR-029.
 * This is a SERVER-TO-SERVER contract, never a client-supplied scan result.
 * Document Service must verify that the document exists, belongs to the
 * authenticated applicant, is classified for the requested purpose and is
 * Available only after MIME/content/size/checksum and malware checks pass.
 * DocumentLink.targetType/targetId refer to an existing application.
 */
export abstract class ApplicationDocumentGateway {
  abstract assertLinkable(input: {
    documentId: string;
    purpose: string;
    targetType: "PostgraduateApplication";
    targetId: string;
    applicantPersonId: string;
    institutionId: string;
  }): Promise<void>;
}

/**
 * Safe default while the Document Service adapter is not in this checkout.
 * No public route can forge a "clean" document or bypass quarantine.
 */
@Injectable()
export class UnavailableApplicationDocumentGateway extends ApplicationDocumentGateway {
  async assertLinkable(): Promise<never> {
    throw new AppException({
      code: ErrorCode.Conflict,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        "FR-029/BR-057/NFR-029: trusted Document Service integration is not configured",
    });
  }
}
