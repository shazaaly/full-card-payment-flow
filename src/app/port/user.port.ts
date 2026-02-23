import { Payment as DomainPayment } from "../../domain/payment_management/payment.entity";
import { UserEntity } from "../../domain/user.entity.ts/user.entity";

export interface UserPort {
  findUserById(id: string): Promise<UserEntity>;
}