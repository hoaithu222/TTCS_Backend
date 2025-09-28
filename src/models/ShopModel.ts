import mongoose from "mongoose";
// Trạng thái của shop chờ duyệt, đang hoạt động, bị khóa
export enum ShopStatus {
  PENDING = "pending",
  ACTIVE = "active",
  BLOCKED = "blocked",
}

export const shopSchema = new mongoose.Schema({
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
  // description
  description: {
    type: String,
    required: true,
  },
  // logo liên với ảnh
  logo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
    required: true,
  },
  // banner liên với ảnh
  banner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  followCount: {
    type: Number,
    default: 0,
  },
  productCount: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  // isActive
  status: {
    type: Boolean,
    default: ShopStatus.PENDING,
    enum: Object.values(ShopStatus),
  },
  //   Liên kết với product
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Product",
  },
});

const ShopModel = mongoose.model("Shop", shopSchema);

export default ShopModel;
