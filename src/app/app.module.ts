import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { PrismaModule } from "../infrastructure/postgres/prisma/prisma.module";
import { AppResolver } from "../interface/resolvers/app.resolver";
import { ApplicationService } from "./services/application.service";
import { MockGatewayService } from "./services/mock-gateway.service";
import { CachingService } from "./services/caching.service";
import { PaymentRepo } from "../infrastructure/payment.repo";
import { UserRepo } from "../infrastructure/user.repo";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { PaymentController } from "../interface/controllers/payment.controller";
import { WebhookController } from "../interface/controllers/webhook.controller";
import { LedgerRepo } from "../infrastructure/ledger.repo";
import { TransactionRepo } from "../infrastructure/transaction.repo";
import { WebhookEventRepo } from "../infrastructure/webhookEvent.repo";
import { OutboxRepo } from "../infrastructure/outbox.repo";
import { LedgerPort } from "./port/ledger";
import { LoggerService } from "./services/logger.service";

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
  controllers: [PaymentController, WebhookController],
  providers: [
    LoggerService,
    AppResolver,
    CachingService,
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
    {
      provide: "LedgerPort",
      useClass: LedgerRepo,
    },
    {
      provide: "WebhookEventPort",
      useClass: WebhookEventRepo,
    },
    {
      provide: "TransactionPort",
      useClass: TransactionRepo,
    },
    {
      provide: "OutboxPort",
      useClass: OutboxRepo,
    },
  ],
})
export class AppModule { }
