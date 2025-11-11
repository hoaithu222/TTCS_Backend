import { Router } from "express";
import {
  getBannerController,
  getHomeCategoriesController,
  getBestSellerProductsController,
  getBestShopsController,
  getFlashSaleProductsController,
  getSearchSuggestionsController,
} from "./home.controller";

const homeRouter = Router();

// Home page endpoints (public, no auth required)
homeRouter.get("/banner", getBannerController);
homeRouter.get("/categories", getHomeCategoriesController);
homeRouter.get("/best-seller", getBestSellerProductsController);
homeRouter.get("/best-shops", getBestShopsController);
homeRouter.get("/flash-sale", getFlashSaleProductsController);
homeRouter.get("/search-suggestion", getSearchSuggestionsController);

export default homeRouter;
