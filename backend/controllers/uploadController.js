
import cloudinary from "../config/cloudinary.js";
import Project from "../models/Project.js";
import Portfolio from "../models/Portfolio.js";
import ContentItem from "../models/ContentItem.js";

// Helper: Upload one image to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "tayyaba-portfolio",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary did not return an upload result."));

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

// Helper: Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId.startsWith("tayyaba-portfolio/")) {
    throw new Error("Invalid image public ID.");
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true
  });

  return result.result;
};

const isReferenced = async ({ publicId, url }) => {
  const projectReference = await Project.exists({
    $or: [
      ...(publicId ? [{ thumbnailPublicId: publicId }, { "galleryAssets.publicId": publicId }] : []),
      ...(url ? [{ thumbnail: url }, { gallery: url }, { "galleryAssets.url": url }] : [])
    ]
  });
  if (projectReference) return true;

  const portfolioReference = await Portfolio.exists({
    $or: [
      ...(publicId ? [{ "data.profile.profileImagePublicId": publicId }, { "data.profile.heroBackgroundImagePublicId": publicId },
        { "data.about.profileImagePublicId": publicId },
        { "data.settings.logoPublicId": publicId }, { "data.settings.faviconPublicId": publicId },
        { "data.settings.ogImagePublicId": publicId }, { "data.resume.publicId": publicId }] : []),
      ...(url ? [{ "data.profile.profileImage": url }, { "data.profile.heroBackgroundImage": url },
        { "data.about.profileImage": url },
        { "data.settings.logo": url }, { "data.settings.favicon": url },
        { "data.settings.ogImage": url }, { "data.resume.url": url }] : [])
    ]
  });
  if (portfolioReference) return true;

  return Boolean(await ContentItem.exists({
    $or: [
      ...(publicId ? [{ "data.imagePublicId": publicId }, { "data.profileImagePublicId": publicId }] : []),
      ...(url ? [{ "data.image": url }, { "data.profileImage": url }] : [])
    ]
  }));
};

const deleteUnreferencedImage = async ({ publicId, url }) => {
  if (await isReferenced({ publicId, url })) {
    throw new Error("This asset is still used by portfolio content. Replace or remove that reference first.");
  }
  return deleteFromCloudinary(publicId);
};

const uploadResumeToCloudinary = (file) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "tayyaba-portfolio/resumes",
      resource_type: "raw",
      use_filename: true,
      unique_filename: true
    },
    (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary did not return an upload result."));
      resolve({ url: result.secure_url, publicId: result.public_id, fileName: file.originalname });
    }
  );
  uploadStream.end(file.buffer);
});

// Single image upload
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload."
      });
    }

    const image = await uploadToCloudinary(req.file);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      image
    });
  } catch (error) {
    console.error("Image Upload Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image upload failed."
    });
  }
};

// Multiple images upload
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image."
      });
    }

    const uploadedImages = [];
    try {
      for (const file of req.files) {
        uploadedImages.push(await uploadToCloudinary(file));
      }
    } catch (error) {
      await Promise.allSettled(uploadedImages.map(({ publicId }) =>
        cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })
      ));
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "All images uploaded successfully!",
      count: uploadedImages.length,
      images: uploadedImages
    });
  } catch (error) {
    console.error("Multiple Image Upload Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Multiple images upload failed."
    });
  }
};

// Delete image from Cloudinary and remove its project references
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body || {};

    if (typeof publicId !== "string" || !publicId.startsWith("tayyaba-portfolio/")) {
      return res.status(400).json({
        success: false,
        message: "Valid image public ID is required."
      });
    }

    const result = await deleteUnreferencedImage({
      publicId,
      url: typeof req.body.imageUrl === "string" ? req.body.imageUrl : ""
    });

    if (result !== "ok") {
      return res.status(404).json({
        success: false,
        message: "Image not found or already deleted."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully!",
      publicId
    });
  } catch (error) {
    console.error("Image Delete Error:", error.message);

    return res.status(error.message.startsWith("This asset is still used") ? 409 : 500).json({
      success: false,
      message: error.message || "Image deletion failed."
    });
  }
};

// Delete multiple images
export const deleteMultipleImages = async (req, res) => {
  try {
    const { images } = req.body || {};

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of images."
      });
    }

    const results = await Promise.all(
      images.map(async (image) => {
        try {
          if (!image.publicId || !image.url) {
            throw new Error("Image public ID and URL are required.");
          }

          const safeResult = await deleteUnreferencedImage({
            publicId: image.publicId,
            url: image.url
          });

          if (safeResult !== "ok") {
            throw new Error("Image not found or already deleted.");
          }

          return {
            publicId: image.publicId,
            success: true
          };
        } catch (error) {
          return {
            publicId: image.publicId || null,
            success: false,
            message: error.message
          };
        }
      })
    );

    const successCount = results.filter((item) => item.success).length;

    return res.status(200).json({
      success: true,
      message: "Bulk image deletion completed.",
      deletedCount: successCount,
      failedCount: results.length - successCount,
      results
    });
  } catch (error) {
    console.error("Bulk Image Delete Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Bulk image deletion failed."
    });
  }
};

export const uploadResume = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "Please select a PDF resume." });
    return;
  }
  if (!req.file.buffer.subarray(0, 5).toString("ascii").startsWith("%PDF-")) {
    res.status(400).json({ success: false, message: "The uploaded file is not a valid PDF." });
    return;
  }
  try {
    const resume = await uploadResumeToCloudinary(req.file);
    resume.url = `${req.protocol}://${req.get("host")}/api/portfolio/resume`;
    res.json({ success: true, resume });
  } catch (error) {
    console.error("Resume Upload Error:", error.message);
    res.status(500).json({ success: false, message: "Resume upload failed." });
  }
};

export const deleteResume = async (req, res) => {
  const { publicId } = req.body || {};
  if (typeof publicId !== "string" || !publicId.startsWith("tayyaba-portfolio/resumes/")) {
    res.status(400).json({ success: false, message: "Valid resume public ID is required." });
    return;
  }
  try {
    if (await Portfolio.exists({ "data.resume.publicId": publicId })) {
      res.status(409).json({
        success: false,
        message: "Replace or remove the current resume reference before deleting this file."
      });
      return;
    }
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true
    });
    if (result.result !== "ok") {
      res.status(404).json({ success: false, message: "Resume not found or already deleted." });
      return;
    }
    res.json({ success: true, message: "Resume deleted." });
  } catch (error) {
    console.error("Resume Delete Error:", error.message);
    res.status(500).json({ success: false, message: "Resume deletion failed." });
  }
};
