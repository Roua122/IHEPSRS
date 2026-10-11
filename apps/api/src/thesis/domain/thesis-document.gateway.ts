import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";

/**
 * FR-029 / NFR-022 / BR-057: the Document domain validates an existing
 * DocumentLink, the document's target and its Available (scan-cleared) state.
 * TH001 never uploads files, guesses MIME validity or trusts raw document IDs.
 */
export interface VerifiedThesisDocumentLink {
  documentLinkId: string;
  documentId: string;
  targetType: "Thesis";
  targetId: string;
  purpose: string;
  available: true;
}

export abstract class ThesisDocumentGateway {
  abstract resolveAvailableLink(
    thesisId: string,
    documentLinkId: string,
  ): Promise<VerifiedThesisDocumentLink>;
}

/** Replace this adapter only after the shared document service is integrated. */
@Injectable()
export class UnavailableThesisDocumentGateway extends ThesisDocumentGateway {
  async resolveAvailableLink(
    _thesisId: string,
    _documentLinkId: string,
  ): Promise<VerifiedThesisDocumentLink> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: "FR-029/NFR-022: verified Thesis DocumentLink service not integrated",
    });
  }
}
