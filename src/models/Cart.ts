import mongoose from "mongoose";
//   id         Int        @id @default(autoincrement())
//   user_id    Int
//   status     CartStatus @default(ACTIVE)
//   created_at DateTime   @default(now())
//   updated_at DateTime   @updatedAt
//   cart_items CartItem[]
export enum CartStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}
export const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "CartItem",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CartStatus),
      required: true,
      default: CartStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

const CartModel = mongoose.model("Cart", cartSchema);
export default CartModel;
