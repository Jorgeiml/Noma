import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { CommercialModule } from "../commercial/commercial.module";
import { OnboardingService } from "./onboarding.service";
import { OnboardingGuard } from "./onboarding.authorization";
import { OnboardingController } from "./onboarding.controller";
@Module({
  imports: [PersistenceModule, CommercialModule],
  providers: [OnboardingService, OnboardingGuard],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
