import HomeConfigurationModel from "../../models/HomeConfigurationModel";
import CategoryModel from "../../models/CategoryModel";

export interface CreateBannerDto {
  image: {
    url: string;
    publicId: string;
  };
  title?: string;
  description?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateSideBannerDto {
  categoryId: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateFeatureDto {
  icon: string;
  text: string;
  iconBg: string;
  hoverColor: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHomeConfigurationDto {
  mainBanners?: CreateBannerDto[];
  sideBanners?: CreateSideBannerDto[];
  features?: CreateFeatureDto[];
  settings?: {
    autoSlideInterval?: number;
    showCounter?: boolean;
    showDots?: boolean;
  };
  isActive?: boolean;
  displayType?: "default" | "compact" | "modern" | "classic";
}

export default class HomeConfigurationService {
  // Get active home configuration
  static async getActiveConfiguration() {
    try {
      const config = await HomeConfigurationModel.findOne({ isActive: true })
        .populate({
          path: "sideBanners.categoryId",
          select: "name image_Background _id",
        })
        .lean()
        .sort({ createdAt: -1 });

      if (!config) {
        // Return default empty configuration
        return {
          ok: true as const,
          configuration: {
            mainBanners: [],
            sideBanners: [],
            features: [],
            settings: {
              autoSlideInterval: 5000,
              showCounter: true,
              showDots: true,
            },
            isActive: true,
          },
        };
      }

      // Map sideBanners to include category data and image
      const mappedSideBanners = (config.sideBanners || [])
        .filter((b: any) => b.isActive)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((banner: any) => {
          const category = banner.categoryId;
          return {
            _id: banner._id,
            categoryId: category?._id || banner.categoryId,
            category: category
              ? {
                  _id: category._id,
                  name: category.name,
                  image_Background: category.image_Background,
                }
              : null,
            image: category?.image_Background || null,
            order: banner.order || 0,
            isActive: banner.isActive ?? true,
          };
        });

      // Sort banners and features by order
      const sortedConfig = {
        ...config,
        mainBanners: (config.mainBanners || [])
          .filter((b: any) => b.isActive)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
        sideBanners: mappedSideBanners,
        features: (config.features || [])
          .filter((f: any) => f.isActive)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      };

      return {
        ok: true as const,
        configuration: sortedConfig,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Get all configurations (for admin)
  static async getAllConfigurations() {
    try {
      const configs = await HomeConfigurationModel.find()
        .populate({
          path: "sideBanners.categoryId",
          select: "name image_Background _id",
        })
        .lean()
        .sort({ createdAt: -1 });

      // Map sideBanners for each config
      const mappedConfigs = configs.map((config: any) => {
        const mappedSideBanners = (config.sideBanners || []).map((banner: any) => {
          const category = banner.categoryId;
          return {
            ...banner,
            categoryId: category?._id || banner.categoryId,
            category: category
              ? {
                  _id: category._id,
                  name: category.name,
                  image_Background: category.image_Background,
                }
              : null,
            image: category?.image_Background || null,
          };
        });
        return {
          ...config,
          sideBanners: mappedSideBanners,
        };
      });

      return {
        ok: true as const,
        configurations: mappedConfigs,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Get configuration by ID
  static async getConfigurationById(id: string) {
    try {
      const config = await HomeConfigurationModel.findById(id)
        .populate({
          path: "sideBanners.categoryId",
          select: "name image_Background _id",
        })
        .lean();

      if (!config) {
        return {
          ok: false as const,
          status: 404,
          message: "Configuration not found",
        };
      }

      // Map sideBanners to include category data and image
      const mappedSideBanners = (config.sideBanners || []).map((banner: any) => {
        const category = banner.categoryId;
        return {
          ...banner,
          categoryId: category?._id || banner.categoryId,
          category: category
            ? {
                _id: category._id,
                name: category.name,
                image_Background: category.image_Background,
              }
            : null,
          image: category?.image_Background || null,
        };
      });

      return {
        ok: true as const,
        configuration: {
          ...config,
          sideBanners: mappedSideBanners,
        },
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Create new configuration
  static async createConfiguration(data: UpdateHomeConfigurationDto) {
    try {
      // Deactivate all existing configurations
      await HomeConfigurationModel.updateMany(
        {},
        { $set: { isActive: false } }
      );

      const newConfig = new HomeConfigurationModel({
        mainBanners: data.mainBanners || [],
        sideBanners: data.sideBanners || [],
        features: data.features || [],
        settings: data.settings || {
          autoSlideInterval: 5000,
          showCounter: true,
          showDots: true,
        },
        isActive: data.isActive !== undefined ? data.isActive : true,
      });

      await newConfig.save();

      return {
        ok: true as const,
        configuration: newConfig.toObject(),
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Update configuration
  static async updateConfiguration(
    id: string,
    data: UpdateHomeConfigurationDto
  ) {
    try {
      const config = await HomeConfigurationModel.findById(id);

      if (!config) {
        return {
          ok: false as const,
          status: 404,
          message: "Configuration not found",
        };
      }

      // If setting as active, deactivate others
      if (data.isActive === true) {
        await HomeConfigurationModel.updateMany(
          { _id: { $ne: id } },
          { $set: { isActive: false } }
        );
      }

      if (data.mainBanners !== undefined) {
        config.mainBanners = data.mainBanners as any;
      }
      if (data.sideBanners !== undefined) {
        config.sideBanners = data.sideBanners as any;
      }
      if (data.features !== undefined) {
        config.features = data.features as any;
      }
      if (data.settings !== undefined) {
        config.settings = {
          ...config.settings,
          ...data.settings,
        } as any;
      }
      if (data.isActive !== undefined) {
        config.isActive = data.isActive;
      }

      await config.save();

      return {
        ok: true as const,
        configuration: config.toObject(),
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Delete configuration
  static async deleteConfiguration(id: string) {
    try {
      const config = await HomeConfigurationModel.findByIdAndDelete(id);

      if (!config) {
        return {
          ok: false as const,
          status: 404,
          message: "Configuration not found",
        };
      }

      return {
        ok: true as const,
        message: "Configuration deleted successfully",
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }
}

