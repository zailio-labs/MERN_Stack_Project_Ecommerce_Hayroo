const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    cName: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    cDescription: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
    },
    cImage: {
      type: String,
    },
    cStatus: {
      type: String,
      required: [true, "Category status is required"],
    },
  },
  { timestamps: true }
);

// Create unique index for cName
categorySchema.index({ cName: 1 }, { unique: true });

const categoryModel = mongoose.model("categories", categorySchema);
module.exports = categoryModel;
