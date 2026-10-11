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

  /**
   * FR-015/029: also verify that the classified purpose corresponds to an
   * acceptable Thesis proposal plan under the institution's document policy.
   * Purpose names belong to the Document service; TH003 does not invent them.
   */
  abstract resolveAvailableProposalPlanLink(
    thesisId: string,
    documentLinkId: string,
  ): Promise<VerifiedThesisDocumentLink>;

  /**
   * FR-029/NFR-022/BR-036: validate the Document service's classification of
   * a scan-cleared FINAL Thesis submission document. This does not upload the
   * file or infer its type from an untrusted client-provided filename/MIME.
   */
  abstract resolveAvailableSubmissionLink(
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

  async resolveAvailableProposalPlanLink(
    _thesisId: string,
    _documentLinkId: string,
  ): Promise<VerifiedThesisDocumentLink> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: "FR-015/029: classified, scan-cleared Thesis proposal plan service not integrated",
    });
  }

  async resolveAvailableSubmissionLink(
    _thesisId: string,
    _documentLinkId: string,
  ): Promise<VerifiedThesisDocumentLink> {
    throw new AppException({
      code: ErrorCode.ServiceUnavailable,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: "FR-016/029/NFR-022: classified, scan-cleared Thesis submission service not integrated",
    });
  }
}
