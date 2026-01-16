const fs = require("fs");
const path = require("path");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");

class Customize {
  async getImages(req, res) {
    try {
      let Images = await customizeModel.find({});
      return res.json({ success: true, Images });
    } catch (err) {
      console.error("Get images error:", err);
      return res.status(500).json({ error: "Failed to fetch images" });
    }
  }

  async uploadSlideImage(req, res) {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    let image = req.file.filename;
    
    // Validate image filename
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: "Invalid image file" });
    }

    try {
      let newCustomize = new customizeModel({
        slideImage: image,
      });
      
      let save = await newCustomize.save();
      
      if (save) {
        return res.json({ 
          success: "Image uploaded successfully",
          image: {
            id: save._id,
            filename: save.slideImage,
            uploadDate: save.createdAt
          }
        });
      } else {
        return res.status(500).json({ error: "Failed to save image" });
      }
    } catch (err) {
      console.error("Upload image error:", err);
      
      // Clean up uploaded file if save fails
      try {
        const filePath = path.join(__dirname, `../public/uploads/customize/${image}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.error("Failed to cleanup uploaded file:", cleanupErr);
      }
      
      return res.status(500).json({ error: "Failed to upload image" });
    }
  }

  async deleteSlideImage(req, res) {
    let { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "Image ID is required" });
    }

    try {
      // Find the image document
      let imageDocument = await customizeModel.findById(id);
      
      if (!imageDocument) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Construct file path (cross-platform compatible)
      const filePath = path.join(__dirname, `../public/uploads/customize/${imageDocument.slideImage}`);
      
      // Delete from database
      let deleteResult = await customizeModel.findByIdAndDelete(id);
      
      if (deleteResult) {
        // Delete the actual file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.error("Failed to delete image file:", fileErr);
          // Continue even if file deletion fails
        }
        
        return res.json({ 
          success: "Image deleted successfully",
          deletedImage: {
            id: deleteResult._id,
            filename: deleteResult.slideImage
          }
        });
      } else {
        return res.status(500).json({ error: "Failed to delete image from database" });
      }
    } catch (err) {
      console.error("Delete image error:", err);
      
      // Handle invalid ID format
      if (err.name === 'CastError') {
        return res.status(400).json({ error: "Invalid image ID format" });
      }
      
      return res.status(500).json({ error: "Failed to delete image" });
    }
  }

  async getAllData(req, res) {
    try {
      // Use Promise.all for parallel execution (faster)
      const [Categories, Products, Orders, Users] = await Promise.all([
        categoryModel.countDocuments({}),
        productModel.countDocuments({}),
        orderModel.countDocuments({}),
        userModel.countDocuments({})
      ]);

      return res.json({ 
        success: true,
        counts: {
          Categories,
          Products,
          Orders,
          Users
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Get all data error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch dashboard data" 
      });
    }
  }

  // Optional: Get dashboard stats with additional info
  async getDashboardStats(req, res) {
    try {
      const [categoryCount, productCount, orderCount, userCount] = await Promise.all([
        categoryModel.countDocuments({}),
        productModel.countDocuments({}),
        orderModel.countDocuments({}),
        userModel.countDocuments({})
      ]);

      // Get recent orders (last 10)
      const recentOrders = await orderModel.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email')
        .lean();

      // Get recent users (last 10)
      const recentUsers = await userModel.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email createdAt')
        .lean();

      return res.json({
        success: true,
        counts: {
          categories: categoryCount,
          products: productCount,
          orders: orderCount,
          users: userCount
        },
        recent: {
          orders: recentOrders,
          users: recentUsers
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
      return res.status(500).json({ 
        error: "Failed to fetch dashboard statistics" 
      });
    }
  }
}

const customizeController = new Customize();
module.exports = customizeController;
