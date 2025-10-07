import EnvironmentVariable from '../models/EnvironmentVariable.js';

const envCache = new Map();

export const getEnvVar = async (key) => {
  if (envCache.has(key)) {
    return envCache.get(key);
  }

  try {
    const envVar = await EnvironmentVariable.findOne({ key });
    if (envVar) {
      envCache.set(key, envVar.value);
      return envVar.value;
    }
  } catch (error) {
    console.error(`Error fetching env var ${key}:`, error);
  }

  // Fallback to process.env for backward compatibility during setup
  return process.env[key];
};

export const setEnvVar = async (key, value, description = '', category = 'api_keys') => {
  try {
    await EnvironmentVariable.findOneAndUpdate(
      { key },
      { value, description, category },
      { upsert: true, new: true }
    );
    envCache.set(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting env var ${key}:`, error);
    return false;
  }
};

export const getAllEnvVars = async () => {
  try {
    const vars = await EnvironmentVariable.find({});
    return vars.reduce((acc, v) => {
      acc[v.key] = v.value;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching all env vars:', error);
    return {};
  }
};
