import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Film, Upload, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Gif {
  _id: string;
  url: string;
  altText?: string;
  category?: string;
  usage: number;
}

interface Video {
  _id: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  engagement: { views: number; clicks: number; plays: number };
}

const MediaLibrary = () => {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'gifs' | 'videos'>('gifs');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGifs();
    fetchVideos();
  }, []);

  const fetchGifs = async () => {
    try {
      const { data } = await axios.get('/api/media/gifs');
      setGifs(data);
    } catch (error) {
      toast.error('Failed to fetch GIFs');
    }
  };

  const fetchVideos = async () => {
    try {
      // Simplified: get all videos
      const { data } = await axios.get('/api/videos'); // Assume endpoint
      setVideos(data || []);
    } catch (error) {
      // Ignore if no endpoint
    }
  };

  const uploadVideo = async () => {
    if (!uploadUrl.trim()) {
      toast.error('Please enter video URL');
      return;
    }

    setUploading(true);
    try {
      const { data } = await axios.post('/api/media/upload-video', {
        url: uploadUrl,
        altText: 'Uploaded video'
      });
      setVideos([data, ...videos]);
      toast.success('Video uploaded successfully!');
      setUploadUrl('');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Film className="h-8 w-8 text-blue-600" />
            Media Library
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            GIFs and videos for your email campaigns
          </p>
        </motion.div>

        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('gifs')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'gifs'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              GIFs
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'videos'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Videos
            </button>
          </div>
        </div>

        {activeTab === 'gifs' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {gifs.map(gif => (
              <div
                key={gif._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <img
                  src={gif.url}
                  alt={gif.altText || 'GIF'}
                  className="w-full h-48 object-cover rounded mb-3"
                />
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>Used {gif.usage} times</span>
                  <button className="text-blue-600 hover:text-blue-700">
                    Use
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Video
              </h2>
              <div className="flex gap-4">
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="Enter video URL"
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={uploadVideo}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map(video => (
                <div
                  key={video._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                >
                  <div className="relative">
                    <img
                      src={video.thumbnailUrl || '/placeholder-video.png'}
                      alt="Video thumbnail"
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-3">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {video.engagement.views} views
                    </span>
                    <button className="text-blue-600 hover:text-blue-700">
                      Analytics
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.success('Thumbnail generation coming soon!')}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      Generate Thumbnail
                    </button>
                    <button
                      onClick={() => toast.success('Fallback coming soon!')}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      Fallback Image
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MediaLibrary;
