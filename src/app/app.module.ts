import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { PrismaModule } from "../infrastructure/postgres/prisma/prisma.module";
import { AppResolver } from "../interface/resolvers/app.resolver";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
    }),
    PrismaModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
