import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { LocalAccessModule } from "../platform/local-access.module";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";
import { SectorCapabilityGuard } from "../sector/sector.guard";
@Module({
  imports: [PersistenceModule, LocalAccessModule],
  controllers: [StaffController],
  providers: [StaffService, SectorCapabilityGuard],
})
export class StaffModule {}
