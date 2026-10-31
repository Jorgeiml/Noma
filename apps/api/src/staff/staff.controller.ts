import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { LocalOwnerGuard, type OwnerRequest } from "../platform/local.guard";
import {
  RequireCapabilities,
  SectorCapabilityGuard,
} from "../sector/sector.guard";
import { StaffService } from "./staff.service";
import {
  branchDto,
  professionalDto,
  resourceDto,
  scheduleDto,
  exceptionDto,
  requirementsDto,
  statusDto,
  versionOf,
  object,
} from "./staff.dto";

function editVersion(body: unknown): number {
  if (!body || typeof body !== "object")
    throw new BadRequestException("Formulario inválido");
  return versionOf((body as Record<string, unknown>).version);
}
function creating(body: unknown): void {
  if (body && typeof body === "object" && "version" in body)
    throw new BadRequestException("Una creación no admite versión externa");
}
@Controller("staff")
@UseGuards(LocalOwnerGuard, SectorCapabilityGuard)
@RequireCapabilities("professionals", "branches", "resources", "workSchedules")
export class StaffController {
  constructor(private readonly staff: StaffService) {}
  @Delete("professionals/:id") removeProfessional(
    @Req() req: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.staff.removeProfessional(
      req.owner,
      id,
      versionOf(object(body, ["version"]).version),
    );
  }
  @Get("configuration") configuration(
    @Req() req: OwnerRequest,
    @Query() query: Record<string, unknown>,
  ) {
    object(query, []);
    return this.staff.configuration(req.owner);
  }
  @Post("branches") branch(@Req() r: OwnerRequest, @Body() b: unknown) {
    creating(b);
    return this.staff.saveBranch(r.owner, branchDto(b));
  }
  @Patch("branches/:id") editBranch(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.saveBranch(r.owner, branchDto(b), id, editVersion(b));
  }
  @Patch("branches/:id/status") branchStatus(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.branchStatus(r.owner, id, statusDto(b));
  }
  @Post("professionals") professional(
    @Req() r: OwnerRequest,
    @Body() b: unknown,
  ) {
    creating(b);
    return this.staff.saveProfessional(r.owner, professionalDto(b));
  }
  @Patch("professionals/:id") editProfessional(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.saveProfessional(
      r.owner,
      professionalDto(b),
      id,
      editVersion(b),
    );
  }
  @Patch("professionals/:id/status") professionalStatus(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.professionalStatus(r.owner, id, statusDto(b));
  }
  @Post("resources") resource(@Req() r: OwnerRequest, @Body() b: unknown) {
    creating(b);
    return this.staff.saveResource(r.owner, resourceDto(b));
  }
  @Patch("resources/:id") editResource(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.saveResource(r.owner, resourceDto(b), id, editVersion(b));
  }
  @Patch("resources/:id/status") resourceStatus(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.resourceStatus(r.owner, id, statusDto(b));
  }
  @Put("schedules") schedule(@Req() r: OwnerRequest, @Body() b: unknown) {
    return this.staff.saveSchedule(r.owner, scheduleDto(b));
  }
  @Post("schedules/:id/exceptions") exception(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    creating(b);
    return this.staff.saveException(r.owner, id, exceptionDto(b));
  }
  @Patch("exceptions/:id") editException(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.saveException(
      r.owner,
      undefined,
      exceptionDto(b),
      id,
      editVersion(b),
    );
  }
  @Patch("exceptions/:id/status") exceptionStatus(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.staff.exceptionStatus(r.owner, id, statusDto(b));
  }
  @Put("branches/:branchId/services/:serviceId/resources") requirements(
    @Req() r: OwnerRequest,
    @Param("branchId", ParseUUIDPipe) branch: string,
    @Param("serviceId", ParseUUIDPipe) service: string,
    @Body() b: unknown,
  ) {
    return this.staff.saveRequirements(
      r.owner,
      branch,
      service,
      requirementsDto(b),
    );
  }
}
