import mongoose from "mongoose";

const contentItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "skills",
        "experience",
        "services",
        "education",
        "certifications",
        "testimonials"
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },
    visible: {
      type: Boolean,
      default: true,
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

contentItemSchema.index({ type: 1, visible: 1, displayOrder: 1 });

const ContentItem = mongoose.model("ContentItem", contentItemSchema);

export default ContentItem;
