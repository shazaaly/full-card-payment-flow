import { Injectable } from "@nestjs/common";
import { UserPort } from "../app/port/user.port";
import { UserEntity } from "../domain/user.entity.ts/user.entity";
import { PrismaService } from "./postgres/prisma/prisma.service";

@Injectable()
export class UserRepo implements UserPort {
  constructor(private readonly prisma: PrismaService) { }

  async findUserById(id: string): Promise<UserEntity> {

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) throw new Error("User not found");
      return new UserEntity({
        id: user.id,
        email: user.email,
        name: user.name ?? "",
      });
    } catch (error) {
      throw new Error("User not found");
    }
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    try {
      const createdUser = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
      return new UserEntity({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name ?? "",
      });
    } catch (error) {
      throw new Error("Failed to create user");
    }
  }
}   