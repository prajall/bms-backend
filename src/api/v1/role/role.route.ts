import express from "express";
import { employeeVerification } from "../../../middlewares/auth.middleware";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  getUserRole,
  updateRole,
} from "./role.controller";
import { createRoleValidation, updateRoleValidation } from "./role.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = express.Router();

router.get("/", employeeVerification, getAllRoles);
router.post("/", createRole);
router.get("/user", getUserRole);
router.get("/:roleId", getRoleById);
router.delete("/:roleId", deleteRole);
router.patch("/:roleId", updateRoleValidation, handleValidation, updateRole);

export default router;

// Router.get("/wa", authChecker, adminChecker, getAllRolesWithAdmin);
// Router.put("/:roleId/update", authChecker, adminChecker, updateRole);

// //Connection for Server Side Event for roles
// let clients: Response[] = [];
// Router.get("/sse", (req: Request, res: Response) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   clients.push(res);

//   req.on("close", () => {
//     clients = clients.filter((client) => client != res);
//   });
// });

// export const sendUpdatedRole = (data: any) => {
//   console.log("Data Updated");
//   return clients.forEach((client) =>
//     client.write(`data: ${JSON.stringify(data)}\n\n`)
//   );
// };
