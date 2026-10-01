import { Module } from "@nestjs/common";

import { AccountModelController } from "./account-model.controller";

@Module({
  controllers: [AccountModelController],
})
export class IdentityModule {}
