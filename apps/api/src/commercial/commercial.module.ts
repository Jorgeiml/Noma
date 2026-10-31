import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { CommercialService } from "./commercial.service";
import { OidcProvider } from "./oidc.provider";
import { CommercialController } from "./commercial.controller";
@Module({
  imports: [PersistenceModule],
  providers: [CommercialService, OidcProvider],
  controllers: [CommercialController],
  exports: [CommercialService],
})
export class CommercialModule {}
