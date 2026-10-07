import { Module } from "@nestjs/common";

import { ResearchModule } from "../research/research.module";
import { PublicationsController } from "./controllers/publications.controller";
import { PublicationService } from "./domain/publication.service";

@Module({
  imports: [ResearchModule],
  controllers: [PublicationsController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationsModule {}
