import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { LocalAccessModule } from "../platform/local-access.module";
import { OfferingController } from "./offering.controller";
import { OfferingService } from "./offering.service";
import { SectorCapabilityGuard } from "../sector/sector.guard";

@Module({
  imports: [PersistenceModule, LocalAccessModule],
  controllers: [OfferingController],
  providers: [OfferingService, SectorCapabilityGuard],
})
export class OfferingModule {}
