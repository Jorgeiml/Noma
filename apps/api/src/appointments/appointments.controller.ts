import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { LocalOwnerGuard, type OwnerRequest } from "../platform/local.guard";
import {
  RequireCapabilities,
  SectorCapabilityGuard,
} from "../sector/sector.guard";
import { object, uuid } from "../staff/staff.dto";
import {
  availabilityOf,
  bookingOf,
  customerOf,
  stateOf,
  pageOf,
} from "./appointment.dto";
import { AppointmentsService } from "./appointments.service";
@Controller("appointments")
@UseGuards(LocalOwnerGuard, SectorCapabilityGuard)
@RequireCapabilities("individualBookings")
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}
  @Get("configuration") configuration(
    @Req() r: OwnerRequest,
    @Query() q: unknown,
  ) {
    object(q, []);
    return this.appointments.configuration(r.owner);
  }
  @Get("availability") availability(
    @Req() r: OwnerRequest,
    @Query() q: unknown,
  ) {
    return this.appointments.availability(r.owner, availabilityOf(q));
  }
  @Get("agenda") agenda(@Req() r: OwnerRequest, @Query() q: unknown) {
    const b = object(q, ["date", "days", "branchId", "professionalId", "page"]);
    return this.appointments.agenda(r.owner, {
      date: b.date as string,
      days: Number(b.days ?? 1),
      branchId: b.branchId ? uuid(b.branchId) : undefined,
      professionalId: b.professionalId ? uuid(b.professionalId) : undefined,
      page: b.page,
    });
  }
  @Get("customers") customers(@Req() r: OwnerRequest, @Query() q: unknown) {
    const b = object(q, ["q", "page"]);
    return this.appointments.customers(
      r.owner,
      typeof b.q === "string" ? b.q : "",
      pageOf(b.page),
    );
  }
  @Post("customers") customer(@Req() r: OwnerRequest, @Body() b: unknown) {
    const v = object(b, ["requestId", "customer"]);
    return this.appointments.createCustomer(
      r.owner,
      uuid(v.requestId),
      customerOf(v.customer),
    );
  }
  @Post() create(@Req() r: OwnerRequest, @Body() b: unknown) {
    return this.appointments.create(r.owner, bookingOf(b));
  }
  @Get(":id") detail(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.appointments.detail(r.owner, id);
  }
  @Patch(":id/reschedule") reschedule(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.appointments.reschedule(r.owner, id, bookingOf(b, true));
  }
  @Patch(":id/state") state(
    @Req() r: OwnerRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() b: unknown,
  ) {
    return this.appointments.changeState(r.owner, id, stateOf(b));
  }
}
