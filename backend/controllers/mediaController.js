// express-async-handler removed - using native async/await
import Gif from '../models/Gif.js';
import Video from '../models/Video.js';
import sharp from 'sharp';

// @desc    Get GIFs
// @route   GET /api/media/gifs
// @access  Private
const getGifs = async (req, res) => {
  try {
  const { category } = req.query;
  const query = category ? { category } : {};
  const gifs = await Gif.find(query).sort({ usage: -1 });
  res.json(gifs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/media/upload-video
// @access  Private
const uploadVideo = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate thumbnail
// @route   POST /api/media/generate-thumbnail
// @access  Private
const generateThumbnail = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get video analytics
// @route   GET /api/media/video-analytics/:videoId
// @access  Private
const getVideoAnalytics = async (req, res) => {
  try {
  const video = await Video.findById(req.params.videoId);
  if (!video) {
    res.status(404);
    throw new Error('Video not found');
  }

  res.json(video.engagement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate fallback image
// @route   POST /api/media/generate-fallback
// @access  Private
const generateFallback = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export {
  getGifs,
  uploadVideo,
  generateThumbnail,
  getVideoAnalytics,
  generateFallback
};
