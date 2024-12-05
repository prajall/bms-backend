import { Request, Response } from "express";
import { Role } from "./role.model";
import { User } from "../user/user.model";
import { apiError, apiResponse } from "../../../utils/response.util";
import { getConfigValue } from "../../../utils/config.utils";
import { RoleProp } from "../../../types/typess";
import { updateConfig } from "../../../utils/config.utils";
// import { sendUpdatedRole } from "./role.route";

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    let roles = await Role.find({ name: { $ne: "master" } }).sort({
      permissions: -1,
    });
    return apiResponse(
      res,
      200,
      "Roles with admin fetched Successfully",
      roles
    );
  } catch (error) {
    console.log(error);
    return apiError(res, 500, "Internal Server Error", error);
  }
};

export const createRole = async (req: Request, res: Response) => {
  const { name, permissions } = req.body;

  const roleName = name.toLowerCase();

  try {
    const existingRole = await Role.findOne({ name: roleName });

    if (existingRole) {
      return apiError(res, 409, `${name} role already exists`);
    }

    const processedPermissions = permissions.map((permission: any) => ({
      module: permission.module?.toLowerCase(),
      actions: permission.actions?.map((action: string) =>
        action.toLowerCase()
      ),
    }));

    const newRole = await Role.create({
      name: roleName,
      permissions: processedPermissions,
    });

    if (!newRole) {
      return apiError(res, 500, "Error creating role in the database");
    }

    return apiResponse(res, 201, "Role created successfully", newRole);
  } catch (error: any) {
    console.error("Error creating role:", error);
    return apiError(res, 500, "Error creating role", error.message);
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  let { roleId } = req.params;

  try {
    const role = await Role.findById(roleId);

    if (!role) {
      return apiError(res, 404, "Role not found");
    }

    return apiResponse(res, 200, "Role fetched successfully", role);
  } catch (error) {
    console.log(error);
    return apiError(res, 500, "Error fetching role", error);
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  let { roleId } = req.params;
  //   const user = req.user;

  try {
    const role = await Role.findById(roleId);

    if (!role) {
      return apiError(res, 404, "Role not found");
    }

    if (
      role.name.toLowerCase() === "admin" ||
      role.name.toLowerCase() === "master" ||
      role.name.toLowerCase() === "user"
    ) {
      return apiError(res, 403, "Cannot delete Admin, Master or User role");
    }

    const isUserAssociated = await User.exists({ role: role.name });

    console.log("Is user associated:", isUserAssociated);
    if (isUserAssociated) {
      return apiError(
        res,
        400,
        "Cannot delete role, Users are associated with this role"
      );
    }

    const response = await Role.findByIdAndDelete(roleId);
    // const updatedRoles = roles.filter((role) => role.name !== roleName);
    // const success = updateConfig("roles", updatedRoles);

    if (!response) {
      return apiError(res, 400, "Role not Found");
    }

    return apiResponse(res, 200, "Role deleted successfully");
  } catch (error) {
    console.log(error);
    return apiError(res, 500, "Error deleting role", error);
  }
};

export const updateRole = async (req: Request, res: Response) => {
  let { roleId } = req.params;
  const { name, permissions } = req.body;
  const user = req.user;

  if (!Array.isArray(permissions)) {
    return apiError(res, 400, "Permissions should be an array");
  }

  try {
    let role = await Role.findById(roleId);

    if (!role) {
      return apiError(res, 404, "Role not found");
    }

    if (role.name === "admin" && user.role != "master") {
      return apiError(res, 403, "Only Master can modify Admin");
    }

    const duplicateRole = await Role.findOne({ name: name });

    if (duplicateRole && duplicateRole.name !== role.name) {
      return apiError(res, 409, `${name} role already exists`);
    }

    const processedPermissions = permissions.map((permission: any) => ({
      module: permission.module?.toLowerCase(),
      actions: permission.actions?.map((action: string) =>
        action.toLowerCase()
      ),
    }));

    const updatedRole = await Role.findByIdAndUpdate(roleId, {
      name: name.toLowerCase(),
      permissions: processedPermissions,
    });

    return apiResponse(
      res,
      200,
      "Permissions updated successfully",
      updatedRole
    );
  } catch (error) {
    console.log(error);
    return apiError(res, 500, "Error updating permissions", error);
  }
};

export const getUserRole = async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    return apiError(res, 401, "Unauthorized");
  }
  try {
    // const role = await Role.findOne({ name: user.role });
    const roles: RoleProp[] = getConfigValue("roles") || [];
    const role = roles.find((role) => role.name === user.role);

    if (!role) {
      return apiError(res, 404, "Role not found");
    }

    return apiResponse(res, 200, "User role fetched successfully", role);
  } catch (error) {
    console.log("Error fetching role: ", error);
    return apiError(res, 500, "Error fetching user role", error);
  }
};

// export const getAllRolesWithAdmin = async (req: Request, res: Response) => {
//   try {
//     let roles = await Role.find({ name: { $ne: "Master" } }).sort({
//       permissions: -1,
//     });

//     if (!roles || roles.length === 0) {
//       return apiError(res, 404, "No roles found");
//     }

//     return apiResponse(
//       res,
//       200,
//       "Roles with Admin fetched successfully",
//       roles
//     );
//   } catch (error) {
//     console.log(error);
//     return apiError(res, 500, "Internal Server Error", error);
//   }
// };
