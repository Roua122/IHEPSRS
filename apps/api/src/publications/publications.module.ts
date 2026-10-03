import { Module } from "@nestjs/common";
import { PublicationService } from "./domain/publication.service";
import { PublicationsController } from "./controllers/publications.controller";

@Module({
  controllers: [PublicationsController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationsModule {}
