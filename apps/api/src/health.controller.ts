import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@ihepsrs/contracts";

import { PublicRoute } from "./identity/authentication/route-access.decorator";

@PublicRoute()
@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      service: "ihepsrs-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
