import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";
import { DatabaseHealthController } from "./health/database-health.controller";
import { PersistenceModule } from "./persistence/persistence.module";
import { PlatformModule } from "./platform/platform.module";
import { OfferingModule } from "./offering/offering.module";
import { StaffModule } from "./staff/staff.module";
import { ControlModule } from "./control/control.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { AppointmentsModule } from "./appointments/appointments.module";

@Module({
  imports: [
    PersistenceModule,
    PlatformModule,
    OfferingModule,
    StaffModule,
    ControlModule,
    OnboardingModule,
    AppointmentsModule,
  ],
  controllers: [HealthController, DatabaseHealthController],
  providers: [HealthService],
})
export class AppModule {}
