
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      trim: true
    },

    techStack: [{
      type: String,
      trim: true
    }],

    thumbnail: {
      type: String,
      required: true
    },

    thumbnailPublicId: {
      type: String,
      default: ""
    },

    gallery: [{
      type: String
    }],

    galleryAssets: [{
      url: { type: String, required: true },
      publicId: { type: String, required: true }
    }],

    liveUrl: {
      type: String,
      default: ""
    },

    githubUrl: {
      type: String,
      default: ""
    },

    featured: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
