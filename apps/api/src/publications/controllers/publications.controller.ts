import { Controller, Get, Post, Body, Param, Patch } from "@nestjs/common";
import { PublicationService } from "../domain/publication.service";
import { CreatePublicationDto, PublicationStatus } from "@ihepsrs/contracts";

@Controller("publications")
export class PublicationsController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get()
  getAllPublications() {
    return this.publicationService.getAllPublications();
  }

  @Get(":id")
  getPublication(@Param("id") id: string) {
    return this.publicationService.getPublication(id);
  }

  @Post()
  registerPublication(@Body() dto: CreatePublicationDto) {
    return this.publicationService.registerPublication(dto);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: { status: PublicationStatus }) {
    return this.publicationService.updatePublicationStatus(id, dto.status);
  }

  @Post(":id/authors/:authorId/link")
  linkExternalAuthor(
    @Param("id") id: string,
    @Param("authorId") authorId: string,
    @Body() dto: { researcherId: string },
  ) {
    return this.publicationService.linkExternalAuthorToResearcher({
      publicationId: id,
      authorId,
      researcherId: dto.researcherId,
    });
  }
}
