import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { CommercialModule } from "../commercial/commercial.module";
import { CommercialPrincipalAdapter } from "./commercial-principal.adapter";
import { ControlGuard } from "./control.guard";
import { ControlFilter } from "./control.filter";
import { ControlController } from "./control.controller";
import { ControlQueries } from "./control.queries";
import { ControlOperations } from "./control.operations";
@Module({
  imports: [PersistenceModule, CommercialModule],
  providers: [
    CommercialPrincipalAdapter,
    ControlGuard,
    ControlFilter,
    ControlQueries,
    ControlOperations,
  ],
  controllers: [ControlController],
})
export class ControlModule {}
