// types.d.ts or in a relevant types file
import { Request } from "express";
import { User } from "../api/v1/user/user.model";
import { Types } from "mongoose";
import { RoleProp } from "./typess";
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
    employee: {
      _id: Types.ObjectId;
      user: {
        email: string;
        _id: Types.ObjectId;
      };
      name: string;
      role: RoleProp;
    };
  }
}
