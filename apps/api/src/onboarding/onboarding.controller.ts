import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  OnboardingGuard,
  type OnboardingRequest,
} from "./onboarding.authorization";
import { OnboardingService } from "./onboarding.service";
@Controller("onboarding")
@UseGuards(OnboardingGuard)
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}
  @Get() snapshot(@Req() r: OnboardingRequest) {
    return this.service.snapshot(r.onboardingPrincipal);
  }
  @Get("entry") entry(@Req() r: OnboardingRequest) {
    return this.service.entry(r.onboardingPrincipal);
  }
  @Post("start") start(@Req() r: OnboardingRequest, @Body() body: unknown) {
    return this.service.start(r.onboardingPrincipal, body);
  }
  @Put("sector") sector(@Req() r: OnboardingRequest, @Body() body: unknown) {
    return this.service.sector(r.onboardingPrincipal, body);
  }
  @Put("business") business(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.business(r.onboardingPrincipal, body);
  }
  @Put("step") step(@Req() r: OnboardingRequest, @Body() body: unknown) {
    return this.service.step(r.onboardingPrincipal, body);
  }
  @Post("complete") complete(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.complete(r.onboardingPrincipal, body);
  }
  @Post("branches") branch(@Req() r: OnboardingRequest, @Body() body: unknown) {
    return this.service.entity(r.onboardingPrincipal, "branch", body);
  }
  @Post("services") offering(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.entity(r.onboardingPrincipal, "service", body);
  }
  @Post("professionals") professional(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.entity(r.onboardingPrincipal, "professional", body);
  }
  @Post("resources") resource(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.entity(r.onboardingPrincipal, "resource", body);
  }
  @Post("schedules") schedule(
    @Req() r: OnboardingRequest,
    @Body() body: unknown,
  ) {
    return this.service.entity(r.onboardingPrincipal, "schedule", body);
  }
}
