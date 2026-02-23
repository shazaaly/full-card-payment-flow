export class UserEntity {
    id: string;
    email: string;
    name?: string;
  
    constructor(props: { id: string; email: string; name?: string }) {
      if (!props.email) {
        throw new Error("Email is required");
      }
      this.id = props.id;
      this.email = props.email;
      this.name = props.name;
    }
  }