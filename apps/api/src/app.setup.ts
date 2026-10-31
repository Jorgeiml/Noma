import type { INestApplication } from "@nestjs/common";
import type { ApiConfig } from "./config";
import { controlOrigin } from "./control/control.policy";

export function configureApp(app: INestApplication, config: ApiConfig): void {
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: [...new Set([config.webOrigin, controlOrigin()])],
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  });
  app.enableShutdownHooks();
}
