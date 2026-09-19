import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { addAddress, deleteAddress, getAddressById, getAllAddresses, setDefaultAddress, updateAddress } from "../../controllers/address.controller.js";
import { addAddressValidator, updateAddressValidator } from "../../validations/address.validator.js";
import validate from "../../middlewares/validate.middleware.js";
import { customer } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post("/add", authenticate, customer, validate(addAddressValidator), addAddress);
router.get("/get-all", authenticate, customer, getAllAddresses);
router.get("/:id", authenticate, customer, getAddressById);
router.patch("/update", authenticate, customer, validate(updateAddressValidator), updateAddress);
router.post("/set-default", authenticate, customer, setDefaultAddress);
router.post("/delete", authenticate, customer,  deleteAddress);

export default router;