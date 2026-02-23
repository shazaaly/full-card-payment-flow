import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { PrismaModule } from "../infrastructure/postgres/prisma/prisma.module";
import { AppResolver } from "../interface/resolvers/app.resolver";
import { ApplicationService } from "./services/application.service";
import { MockGatewayService } from "./services/mock-gateway.service";
import { PaymentRepo } from "../infrastructure/payment.repo";
import { UserRepo } from "../infrastructure/user.repo";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { PaymentController } from "../interface/controllers/payment.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [PaymentController],
  providers: [
    AppResolver,
    ApplicationService,
    MockGatewayService,
    {
      provide: "PaymentPort",
      useClass: PaymentRepo,
    },
    {
      provide: "UserPort",
      useClass: UserRepo,
    },
  ],
})
export class AppModule { }
