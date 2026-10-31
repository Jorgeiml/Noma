import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Req,
  UseGuards,
  Query,
  BadRequestException,
} from "@nestjs/common";
import type { OwnerRequest } from "./local.guard";
import { LocalOwnerGuard } from "./local.guard";
import {
  EstablishmentUpdateDto,
  EstablishmentValidationPipe,
} from "./establishment.dto";
import { PlatformService } from "./platform.service";
import { LogoValidationPipe, type LogoDto } from "./logo.dto";

@Controller("platform")
@UseGuards(LocalOwnerGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}
  @Get("context")
  context(@Req() request: OwnerRequest) {
    return request.owner;
  }
  @Get("sector-configuration")
  async sector(
    @Req() request: OwnerRequest,
    @Query() query: Record<string, unknown>,
  ) {
    if (Object.keys(query).length)
      throw new BadRequestException(
        "El sector se resuelve desde la sesión; no admite parámetros externos",
      );
    return (
      await this.platform.read(request.owner, request.owner.establishmentId)
    ).sectorConfiguration;
  }
  @Get("establishments/:id")
  read(@Req() request: OwnerRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.platform.read(request.owner, id);
  }
  @Patch("establishments/:id")
  update(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(EstablishmentValidationPipe) dto: EstablishmentUpdateDto,
  ) {
    return this.platform.update(request.owner, id, dto);
  }
  @Put("establishments/:id/logo")
  logo(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(LogoValidationPipe) dto: LogoDto,
  ) {
    return this.platform.updateLogo(request.owner, id, dto);
  }
}
