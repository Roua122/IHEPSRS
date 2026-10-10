import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";

import { ConfigurationModule } from "./config/configuration.module";
import { validateEnvironment } from "./config/environment";
import { HealthController } from "./health.controller";
import { IdentityModule } from "./identity/identity.module";
import { InstitutionsModule } from "./institutions/institutions.module";
import { ResearchModule } from "./research/research.module";
import { PublicationsModule } from "./publications/publications.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(process.cwd(), "../../.env"),
        resolve(process.cwd(), ".env"),
      ],
      validate: validateEnvironment,
    }),
    ConfigurationModule,
    IdentityModule,
    InstitutionsModule,
    ResearchModule,
    PublicationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
