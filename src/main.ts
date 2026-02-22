import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "*" });
  await app.listen(Number(process.env.SERVER_PORT));
}

bootstrap();
