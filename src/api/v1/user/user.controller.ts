import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { User } from "./user.model";
import { Role } from "../role/role.model";
import { apiError, apiResponse } from "../../../utils/response.util";

// Generate JWT token
const generateToken = (id: any) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Jwt secret is not available");
  }

  const token = jwt.sign({ id }, secret);
  return token;
};

// export const signupUser = async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   try {
//     // Check if user already exists
//     const userExist = await User.findOne({ email });
//     if (userExist) {
//       return apiError(res, 409, "Email already exists");
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const createdUser = await User.create({
//       email,
//       password: hashedPassword,
//     });
//     const filteredUser: any = createdUser.toObject();

//     delete filteredUser.password;

//     return apiResponse(res, 200, "User Created Successfully", filteredUser);
//   } catch (error: any) {
//     console.log(error);
//     return apiError(res, 500, "Internal Server Error", error);
//   }
// };

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return apiError(res, 404, "User not found");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return apiError(res, 400, "Incorrect Password");
    }

    const filteredUser = user.toObject() as any;
    if (filteredUser.password) {
      delete filteredUser.password;
    }

    // const userRole = await Role.findOne({ name: user.role });

    const token = generateToken(user._id.toString());

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 2592000000),
      })
      .json({
        success: true,
        message: "User Logged In Successfully",
        user: filteredUser,
      });
  } catch (error: any) {
    console.log(error);
    if (error.message) {
      return apiError(res, 500, error.message, error);
    }
    return apiError(res, 500, "Internal Server Error", error);
  }
};

// export const deleteUser = async (req: Request, res: Response) => {
//   const { userId } = req.params;

//   // const user = req.user;

//   try {
//     const userToDelete = await User.findById(userId);

//     if (!userToDelete) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // if (userToDelete.role === "Admin" && user.role !== "Master") {
//     //   return res
//     //     .status(403)
//     //     .json({ message: "Access Denied. Only Master can delete Admins" });
//     // }

//     // Find the user by ID and delete them
//     const deletedUser = await User.findByIdAndDelete(userId);

//     console.log(deletedUser);
//     if (!deletedUser) {
//       return res.status(404).json({ message: "Failed to Delete User" });
//     }

//     return res.status(200).json({ message: "User deleted successfully" });
//   } catch (error) {
//     console.log("Error Deleting user:", error);
//     return res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

export const getUserInfo = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    if (!user) {
      return apiError(res, 404, "User not found");
    }

    const filteredUser = user.toObject() as any;
    delete filteredUser.createdAt;
    delete filteredUser.updatedAt;
    delete filteredUser.__v;

    return apiResponse(
      res,
      200,
      "User info fetched successfully",
      filteredUser
    );
  } catch (err: any) {
    console.error("Error fetching user info: ", err);
    return res.status(400).json({ message: err.message });
  }
};

// export const getAllUsers = async (req: Request, res: Response) => {
//   const page = parseInt(req.query.page?.toString() || "1");
//   const limit = parseInt(req.query.limit?.toString() || "10");
//   const sortField: string = req.query.sortField?.toString() || "email";
//   const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

//   const startIndex = (page - 1) * limit;

//   try {
//     const totalUsers = await User.countDocuments();
//     const users = await User.find({ role: { $ne: "Master" } })
//       .sort({ [sortField]: sortOrder })
//       .skip(startIndex)
//       .limit(limit);

//     const totalPages = Math.ceil(totalUsers / limit);

//     return res.status(200).json(users);
//   } catch (error) {
//     console.error("Failed to fetch users:", error);
//     return res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

// export const updateUserRole = async (req: Request, res: Response) => {
//   const { newRole } = req.body;
//   const userIdToUpdate = req.params.userId;
//   console.log("userIdToUpdate", userIdToUpdate);
//   const user = req.user;

//   try {
//     console.log("user update");
//     if (!user) {
//       return res.status(404).json({ message: "No user. Please Login" });
//     }

//     const newRoleDocs = await Role.findOne({ name: newRole });

//     if (!newRoleDocs) {
//       return res.status(400).json({ message: "Invalid role specified" });
//     }
//     if (newRoleDocs.name === "Master") {
//       return res.status(403).json({ message: "Cannot assign Master role" });
//     }

//     const userDoc = await User.findById(userIdToUpdate).select("-password");
//     if (!userDoc) {
//       return res.status(404).json({ message: "User to Update not found" });
//     }

//     if (userDoc.role === "Admin" && user.role != "Master") {
//       return res.status(403).json({
//         message: "Access Denied. Only master can change Admin's role",
//       });
//     }

//     userDoc.role = newRoleDocs.name;
//     userDoc.roleId = newRoleDocs._id;

//     await userDoc.save();

//     return res.status(200).json(userDoc);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal Server Error", error });
//   }
// };
