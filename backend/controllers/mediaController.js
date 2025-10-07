// express-async-handler removed - using native async/await
import Gif from '../models/Gif.js';
import Video from '../models/Video.js';
import sharp from 'sharp';

// @desc    Get GIFs
// @route   GET /api/media/gifs
// @access  Private
const getGifs = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = category ? { category } : {};
  const gifs = await Gif.find(query).sort({ usage: -1 });
  res.json(gifs);
});

// @desc    Upload video
// @route   POST /api/media/upload-video
// @access  Private
const uploadVideo = asyncHandler(async (req, res) => {
  // Simplified: assume video URL from upload
  const { url, altText, tags } = req.body;
  const userId = req.user._id;

  const video = await Video.create({
    user: userId,
    url,
    altText,
    tags: tags ? tags.split(',') : []
  });

  res.status(201).json(video);
});

// @desc    Generate thumbnail
// @route   POST /api/media/generate-thumbnail
// @access  Private
const generateThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  // In real implementation, extract frame from video
  // For now, placeholder
  const thumbnailUrl = `thumbnail-${video.url}`;
  video.thumbnailUrl = thumbnailUrl;
  await video.save();

  res.json({ thumbnailUrl });
});

// @desc    Get video analytics
// @route   GET /api/media/video-analytics/:videoId
// @access  Private
const getVideoAnalytics = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  res.json(video.engagement);
});

// @desc    Generate fallback image
// @route   POST /api/media/generate-fallback
// @access  Private
const generateFallback = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  // Generate static image from video
  const fallbackUrl = `fallback-${video.url}`;
  video.fallbackImageUrl = fallbackUrl;
  await video.save();

  res.json({ fallbackUrl });
});

export {
  getGifs,
  uploadVideo,
  generateThumbnail,
  getVideoAnalytics,
  generateFallback
};
