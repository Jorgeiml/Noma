import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { LocalAccessModule } from "./local-access.module";

@Module({
  imports: [PersistenceModule, LocalAccessModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
