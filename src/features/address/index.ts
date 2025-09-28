import { Router } from "express";
import {
  listAddressesController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
  getAddressByIdController,
} from "./address.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const addressRouter = Router();

addressRouter.get("/", authenticateToken, listAddressesController);
addressRouter.post("/", authenticateToken, createAddressController);
addressRouter.put("/:id", authenticateToken, updateAddressController);
addressRouter.delete("/:id", authenticateToken, deleteAddressController);
addressRouter.post(
  "/:id/default",
  authenticateToken,
  setDefaultAddressController
);
addressRouter.get("/:id", authenticateToken, getAddressByIdController);

export default addressRouter;
