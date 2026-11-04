import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { LocalAccessModule } from "../platform/local-access.module";
import { SectorCapabilityGuard } from "../sector/sector.guard";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
@Module({
  imports: [PersistenceModule, LocalAccessModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SectorCapabilityGuard],
})
export class AppointmentsModule {}
