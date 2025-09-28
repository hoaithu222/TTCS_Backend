import mongoose from "mongoose";

export const userAddressSchema = new mongoose.Schema({
  // user id
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // name
  name: {
    type: String,
    required: true,
  },
  // phone
  phone: {
    type: String,
    required: true,
  },
  // address
  addressDetail: {
    type: String,
    required: true,
  },
  // Tỉnh
  city: {
    type: String,
    required: true,
  },
  // xã/phường
  district: {
    type: String,
    required: true,
  },
  // isDefault
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const UserAddressModel = mongoose.model("UserAddress", userAddressSchema);

export default UserAddressModel;
