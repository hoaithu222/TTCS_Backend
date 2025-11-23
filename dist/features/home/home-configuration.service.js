"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HomeConfigurationModel_1 = __importDefault(require("../../models/HomeConfigurationModel"));
class HomeConfigurationService {
    // Get active home configuration
    static async getActiveConfiguration() {
        try {
            const config = await HomeConfigurationModel_1.default.findOne({ isActive: true })
                .populate({
                path: "sideBanners.categoryId",
                select: "name image_Background _id",
            })
                .lean()
                .sort({ createdAt: -1 });
            if (!config) {
                // Return default empty configuration
                return {
                    ok: true,
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
                .filter((b) => b.isActive)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((banner) => {
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
                    .filter((b) => b.isActive)
                    .sort((a, b) => (a.order || 0) - (b.order || 0)),
                sideBanners: mappedSideBanners,
                features: (config.features || [])
                    .filter((f) => f.isActive)
                    .sort((a, b) => (a.order || 0) - (b.order || 0)),
            };
            return {
                ok: true,
                configuration: sortedConfig,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get all configurations (for admin)
    static async getAllConfigurations() {
        try {
            const configs = await HomeConfigurationModel_1.default.find()
                .populate({
                path: "sideBanners.categoryId",
                select: "name image_Background _id",
            })
                .lean()
                .sort({ createdAt: -1 });
            // Map sideBanners for each config
            const mappedConfigs = configs.map((config) => {
                const mappedSideBanners = (config.sideBanners || []).map((banner) => {
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
                ok: true,
                configurations: mappedConfigs,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get configuration by ID
    static async getConfigurationById(id) {
        try {
            const config = await HomeConfigurationModel_1.default.findById(id)
                .populate({
                path: "sideBanners.categoryId",
                select: "name image_Background _id",
            })
                .lean();
            if (!config) {
                return {
                    ok: false,
                    status: 404,
                    message: "Configuration not found",
                };
            }
            // Map sideBanners to include category data and image
            const mappedSideBanners = (config.sideBanners || []).map((banner) => {
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
                ok: true,
                configuration: {
                    ...config,
                    sideBanners: mappedSideBanners,
                },
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Create new configuration
    static async createConfiguration(data) {
        try {
            // Deactivate all existing configurations
            await HomeConfigurationModel_1.default.updateMany({}, { $set: { isActive: false } });
            const newConfig = new HomeConfigurationModel_1.default({
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
                ok: true,
                configuration: newConfig.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Update configuration
    static async updateConfiguration(id, data) {
        try {
            const config = await HomeConfigurationModel_1.default.findById(id);
            if (!config) {
                return {
                    ok: false,
                    status: 404,
                    message: "Configuration not found",
                };
            }
            // If setting as active, deactivate others
            if (data.isActive === true) {
                await HomeConfigurationModel_1.default.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
            }
            if (data.mainBanners !== undefined) {
                config.mainBanners = data.mainBanners;
            }
            if (data.sideBanners !== undefined) {
                config.sideBanners = data.sideBanners;
            }
            if (data.features !== undefined) {
                config.features = data.features;
            }
            if (data.settings !== undefined) {
                config.settings = {
                    ...config.settings,
                    ...data.settings,
                };
            }
            if (data.isActive !== undefined) {
                config.isActive = data.isActive;
            }
            await config.save();
            return {
                ok: true,
                configuration: config.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Delete configuration
    static async deleteConfiguration(id) {
        try {
            const config = await HomeConfigurationModel_1.default.findByIdAndDelete(id);
            if (!config) {
                return {
                    ok: false,
                    status: 404,
                    message: "Configuration not found",
                };
            }
            return {
                ok: true,
                message: "Configuration deleted successfully",
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
}
exports.default = HomeConfigurationService;
