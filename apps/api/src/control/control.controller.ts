import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { COMMERCIAL_PLANS, PLAN_TERMS } from "../commercial/plan.contract";
import {
  ControlGuard,
  NeedsControl,
  type ControlRequest,
} from "./control.guard";
import { ControlFilter } from "./control.filter";
import { ControlQueries } from "./control.queries";
import { ControlOperations } from "./control.operations";
import { ROLE_PERMISSIONS } from "./control.contract";
import { assertStrongAuthentication } from "./control.policy";
import {
  activationChangeOf,
  activationOf,
  decisionOf,
  pageOf,
  roleOf,
} from "./control.dto";
@Controller("control")
@UseGuards(ControlGuard)
@UseFilters(ControlFilter)
export class ControlController {
  constructor(
    private readonly queries: ControlQueries,
    private readonly operations: ControlOperations,
  ) {}
  @Get("context") @NeedsControl("dashboard.read") context(
    @Req() req: ControlRequest,
  ) {
    let sensitiveOperationsAvailable = true;
    try {
      assertStrongAuthentication(req.control);
    } catch {
      sensitiveOperationsAvailable = false;
    }
    return {
      user: { id: req.control.userId, name: req.control.name },
      role: req.platformRole,
      permissions: ROLE_PERMISSIONS[req.platformRole],
      sensitiveOperationsAvailable,
      mfaEvidenceAvailable: req.control.mfaVerified,
      plans: COMMERCIAL_PLANS,
      planTerms: PLAN_TERMS,
    };
  }
  @Get("dashboard") @NeedsControl("dashboard.read") dashboard(
    @Req() req: ControlRequest,
  ) {
    return this.queries.dashboard(ROLE_PERMISSIONS[req.platformRole]);
  }
  @Get("applications") @NeedsControl("applications.read") applications(
    @Query() query: unknown,
  ) {
    return this.queries.applications(pageOf(query));
  }
  @Get("applications/:id") @NeedsControl("applications.read") application(
    @Req() req: ControlRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.queries.application(
      id,
      ROLE_PERMISSIONS[req.platformRole].includes("audit.read"),
    );
  }
  @Post("applications/:id/decision")
  @NeedsControl("applications.decide")
  decide(
    @Req() req: ControlRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.operations.decide(req.control, id, decisionOf(body));
  }
  @Post("applications/:id/manual-activation")
  @NeedsControl("subscriptions.manage")
  activate(
    @Req() req: ControlRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.operations.activate(req.control, id, activationOf(body));
  }
  @Put("applications/:id/manual-activation")
  @NeedsControl("subscriptions.manage")
  changeActivation(
    @Req() req: ControlRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.operations.changeActivation(
      req.control,
      id,
      activationChangeOf(body),
    );
  }
  @Get("businesses") @NeedsControl("businesses.read") businesses(
    @Query() query: unknown,
  ) {
    return this.queries.businesses(pageOf(query));
  }
  @Get("businesses/:id") @NeedsControl("businesses.read") business(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.queries.business(id);
  }
  @Get("subscriptions") @NeedsControl("subscriptions.read") subscriptions(
    @Query() query: unknown,
  ) {
    return this.queries.subscriptions(pageOf(query));
  }
  @Get("users") @NeedsControl("users.read") users(@Query() query: unknown) {
    return this.queries.users(pageOf(query));
  }
  @Put("users/:id/platform-access") @NeedsControl("roles.manage") role(
    @Req() req: ControlRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.operations.changeRole(req.control, id, roleOf(body));
  }
  @Get("audit") @NeedsControl("audit.read") audit(@Query() query: unknown) {
    return this.queries.audit(pageOf(query));
  }
}
