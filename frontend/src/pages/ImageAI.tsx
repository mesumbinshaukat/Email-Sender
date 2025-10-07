import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Image, Wand2, Download, Edit3, TestTube } from 'lucide-react';

interface GeneratedImage {
  _id: string;
  prompt: string;
  url: string;
  altText?: string;
  optimizedUrl?: string;
  isOptimized: boolean;
}

const ImageAI = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data } = await axios.get('/api/images/library');
      setImages(data);
    } catch (error) {
      toast.error('Failed to fetch images');
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/images/generate', {
        prompt,
        size
      });
      setImages([data, ...images]);
      toast.success('Image generated successfully!');
      setPrompt('');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = async (imageId: string) => {
    setOptimizing(imageId);
    try {
      const { data } = await axios.post('/api/images/optimize', { imageId });
      setImages(images.map(img =>
        img._id === imageId ? { ...img, optimizedUrl: data.optimizedUrl, isOptimized: true } : img
      ));
      toast.success('Image optimized!');
    } catch (error) {
      toast.error('Failed to optimize image');
    } finally {
      setOptimizing(null);
    }
  };

  const generateAltText = async (imageId: string) => {
    try {
      const { data } = await axios.post('/api/images/generate-alt-text', { imageId });
      setImages(images.map(img =>
        img._id === imageId ? { ...img, altText: data.altText } : img
      ));
      toast.success('Alt text generated!');
    } catch (error) {
      toast.error('Failed to generate alt text');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Image className="h-8 w-8 text-blue-600" />
            AI Image Generator
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate and optimize images for your emails using AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generate Image
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate (e.g., 'A professional email header with blue and white colors')"
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="256x256">256x256 (Small)</option>
                    <option value="512x512">512x512 (Medium)</option>
                    <option value="1024x1024">1024x1024 (Large)</option>
                  </select>
                </div>

                <button
                  onClick={generateImage}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Wand2 className="h-5 w-5" />
                  )}
                  Generate Image
                </button>
              </div>
            </div>
          </motion.div>

          {/* Images Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Image className="h-5 w-5" />
                Your Images
              </h2>

              {images.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No images yet. Generate your first one!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map(image => (
                    <div
                      key={image._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={image.optimizedUrl || image.url}
                        alt={image.altText || image.prompt}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {image.prompt}
                      </p>
                      {image.altText && (
                        <p className="text-xs text-green-600 mb-2">
                          Alt: {image.altText}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {!image.isOptimized && (
                          <button
                            onClick={() => optimizeImage(image._id)}
                            disabled={optimizing === image._id}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            {optimizing === image._id ? 'Optimizing...' : 'Optimize'}
                          </button>
                        )}
                        {!image.altText && (
                          <button
                            onClick={() => generateAltText(image._id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs"
                          >
                            <Edit3 className="h-3 w-3" />
                            Alt Text
                          </button>
                        )}
                        <button
                          onClick={() => toast.success('A/B test coming soon!')}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-xs"
                        >
                          <TestTube className="h-3 w-3" />
                          A/B Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ImageAI;
