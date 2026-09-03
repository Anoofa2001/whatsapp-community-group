const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true
    },

    groupNumber: {
      type: Number,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    whatsappInviteLink: {
      type: String,
      default: ""
    },

    maxMembers: {
      type: Number,
      default: 20
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);