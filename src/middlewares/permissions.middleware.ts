import { NextFunction, Request, Response } from "express";
import { Role } from "../api/v1/role/role.model";
import { User } from "../api/v1/user/user.model";

export const checkPermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role?._id.toString();
      const userType = req.user?.type?.toString();

      if (userType === "super_admin") {
        return next();
      }

      if (!userRole) {
        return res
          .status(403)
          .json({ message: "Access Denied: No Role Found" });
      }

      const roleDoc = await Role.findById(userRole);

      if (!roleDoc) {
        console.log("no role doc");
        return res.status(403).json({ message: "User's Role not found" });
      }

      if (roleDoc.name === "master") {
        return;
      }

      const hasPermission = roleDoc.permissions.some((permission: any) => {
        return (
          permission.module.toLowerCase() === module.toLowerCase() &&
          permission.actions
            .map((a: string) => a.toLowerCase())
            .includes(action.toLowerCase())
        );
      });

      if (!hasPermission) {
        return res.status(403).json({
          message:
            "Access Denied. You do not have permission to perform this action",
        });
      }
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

// Update this to use the new user model

// export const adminChecker = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const user = req.user;

//     if (!user || !user._id) {
//       return res.status(403).json({ message: "Not Authenticated" });
//     }

//     const userDoc = await User.findById(user._id);

//     if (!userDoc) {
//       return res.status(403).json({ message: "User not found" });
//     }
//     console.log(userDoc);
//     if (userDoc.role != "Admin" && userDoc.role != "Master") {
//       return res.status(403).json({ message: "Access Denied: Admins only" });
//     }
//     console.log("Next Admin Checker");
//     next();
//   } catch (error) {
//     return res.status(500).json({ message: "Internal Server Error", error });
//   }
// };
// Update this to use the new user model
// export const masterChecker = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const user = req.user;

//     if (!user || !user.id) {
//       return res.status(403).json({ message: "Not Authenticated" });
//     }

//     const userDoc = await User.findById(user.id);

//     if (!userDoc) {
//       return res.status(403).json({ message: "User not found" });
//     }

//     if (userDoc.role !== "Master") {
//       return res
//         .status(403)
//         .json({ message: 'Forbidden. Only for "Master" role' });
//     }

//     next();
//   } catch (error) {
//     return res.status(500).json({ message: "Internal Server Error", error });
//   }
// };
