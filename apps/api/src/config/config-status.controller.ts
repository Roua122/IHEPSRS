import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { BusinessPolicyService } from "./business-policy.service";

import { PublicRoute } from "../identity/authentication/route-access.decorator";

@PublicRoute()
@Controller("config")
export class ConfigStatusController {
  constructor(
    private readonly config: ConfigService,
    private readonly policies: BusinessPolicyService,
  ) {}

  @Get("status")
  getStatus() {
    const policy = this.policies.getPolicyAt();

    // Deliberately excludes DATABASE_URL, passwords, tokens and other secrets.
    return {
      environment: this.config.get<string>("NODE_ENV"),
      appVersion: this.config.get<string>("APP_VERSION"),
      integrationContractVersion: this.config.get<string>(
        "INTEGRATION_CONTRACT_VERSION",
      ),
      policyVersion: policy.policyVersion,
      secretsExposed: false,
    };
  }
}
