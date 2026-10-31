import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Query,
  BadRequestException,
  Headers,
  Delete,
} from "@nestjs/common";
import { LocalOwnerGuard, type OwnerRequest } from "../platform/local.guard";
import {
  RequireCapabilities,
  SectorCapabilityGuard,
} from "../sector/sector.guard";
import { OfferingService } from "./offering.service";
import { object, versionOf } from "../staff/staff.dto";
import {
  OfferingDto,
  UpdateOfferingDto,
  OfferingStatusDto,
  CreateOfferingPipe,
  UpdateOfferingPipe,
  OfferingStatusPipe,
} from "./offering.dto";

@Controller("offering/services")
@UseGuards(LocalOwnerGuard, SectorCapabilityGuard)
@RequireCapabilities("individualServices", "flexiblePricing")
export class OfferingController {
  constructor(private readonly offering: OfferingService) {}
  @Delete(":id") remove(
    @Req() req: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.offering.remove(
      req.owner,
      id,
      versionOf(object(body, ["version"]).version),
    );
  }
  @Get()
  list(@Req() request: OwnerRequest, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length)
      throw new BadRequestException(
        "El establecimiento del catálogo se resuelve desde la sesión; no admite parámetros externos",
      );
    return this.offering.list(request.owner);
  }
  @Get(":id") read(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.offering.read(request.owner, id);
  }
  @Post() create(
    @Req() request: OwnerRequest,
    @Body(CreateOfferingPipe) dto: OfferingDto,
    @Headers("x-catalog-currency") expectedCurrency: string | undefined,
  ) {
    return this.offering.create(request.owner, dto, expectedCurrency);
  }
  @Patch(":id") update(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(UpdateOfferingPipe) dto: UpdateOfferingDto,
  ) {
    return this.offering.update(request.owner, id, dto);
  }
  @Patch(":id/status") status(
    @Req() request: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(OfferingStatusPipe) dto: OfferingStatusDto,
  ) {
    return this.offering.update(request.owner, id, dto);
  }
}
