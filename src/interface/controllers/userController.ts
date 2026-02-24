import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ApplicationService } from "../../app/services/application.service";
import { UserEntity } from "../../domain/user.entity.ts/user.entity";

@Controller("/users")
export class UserController {
  constructor(private readonly applicationService: ApplicationService) { }

  @Post("/create")
  async createUser(
    @Body() user: UserEntity,
  ): Promise<UserEntity> {
    return await this.applicationService.createUser(user);
  }

  @Get("/:id")
  async findUserById(
    @Param("id") id: string,
  ): Promise<UserEntity> {
    return await this.applicationService.findUserById(id);
  }
}