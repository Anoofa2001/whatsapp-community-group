const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    country: {
      type: String,
      required: true
    },

    whatsappNumber: {
      type: String,
      required: true
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);