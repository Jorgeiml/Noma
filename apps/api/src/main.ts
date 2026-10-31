import "reflect-metadata";
import "./env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { loadConfig } from "./config";

async function bootstrap(): Promise<void> {
  const config = loadConfig(process.env);
  const app = await NestFactory.create(AppModule);
  configureApp(app, config);
  await app.listen(config.port, "127.0.0.1");
}

void bootstrap().catch(() => {
  console.error(
    "La API no pudo iniciarse. Revisa la configuración y el puerto.",
  );
  process.exitCode = 1;
});
