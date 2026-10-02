import { Module } from "@nestjs/common";

import { AccountModelController } from "./account-model.controller";
import { RoleCatalogueController } from "./role-catalogue.controller";

@Module({
  controllers: [AccountModelController, RoleCatalogueController],
})
export class IdentityModule {}
