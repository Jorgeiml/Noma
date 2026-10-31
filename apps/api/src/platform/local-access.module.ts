import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { LocalAccessController } from "./local-access.controller";
import { LocalIdentityService } from "./local-identity.service";
import { LocalOwnerGuard } from "./local.guard";
import { CommercialModule } from "../commercial/commercial.module";

// Soporte de identidad local reutilizable; no expone repositorios de Plataforma.
@Module({
  imports: [PersistenceModule, CommercialModule],
  controllers: [LocalAccessController],
  providers: [LocalIdentityService, LocalOwnerGuard],
  exports: [LocalOwnerGuard, LocalIdentityService, CommercialModule],
})
export class LocalAccessModule {}
