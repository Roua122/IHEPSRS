import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE_METADATA = "ihepsrs.public-route";
export const AUTHENTICATED_ONLY_METADATA = "ihepsrs.authenticated-only";

export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_METADATA, true);
export const AuthenticatedOnly = () =>
  SetMetadata(AUTHENTICATED_ONLY_METADATA, true);
