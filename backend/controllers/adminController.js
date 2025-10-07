import asyncHandler from 'express-async-handler';
import EnvironmentVariable from '../models/EnvironmentVariable.js';
import { setEnvVar, getAllEnvVars } from '../utils/envManager.js';

// @desc    Get all environment variables
// @route   GET /api/admin/env-vars
// @access  Private (Admin only)
const getEnvVars = asyncHandler(async (req, res) => {
  const envVars = await EnvironmentVariable.find({}).select('-__v');
  res.json(envVars);
});

// @desc    Set environment variable
// @route   POST /api/admin/env-vars
// @access  Private (Admin only)
const setEnvVarHandler = asyncHandler(async (req, res) => {
  const { key, value, description, category } = req.body;

  if (!key || !value) {
    res.status(400);
    throw new Error('Key and value are required');
  }

  const success = await setEnvVar(key, value, description, category);
  if (success) {
    res.json({ message: 'Environment variable set successfully' });
  } else {
    res.status(500);
    throw new Error('Failed to set environment variable');
  }
});

// @desc    Update environment variable
// @route   PUT /api/admin/env-vars/:key
// @access  Private (Admin only)
const updateEnvVar = asyncHandler(async (req, res) => {
  const { value, description, category } = req.body;
  const key = req.params.key;

  const updated = await EnvironmentVariable.findOneAndUpdate(
    { key },
    { value, description, category },
    { new: true }
  );

  if (updated) {
    res.json(updated);
  } else {
    res.status(404);
    throw new Error('Environment variable not found');
  }
});

// @desc    Delete environment variable
// @route   DELETE /api/admin/env-vars/:key
// @access  Private (Admin only)
const deleteEnvVar = asyncHandler(async (req, res) => {
  const key = req.params.key;

  const deleted = await EnvironmentVariable.findOneAndDelete({ key });
  if (deleted) {
    res.json({ message: 'Environment variable deleted' });
  } else {
    res.status(404);
    throw new Error('Environment variable not found');
  }
});

// @desc    Get environment variables by category
// @route   GET /api/admin/env-vars/category/:category
// @access  Private (Admin only)
const getEnvVarsByCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  const envVars = await EnvironmentVariable.find({ category }).select('-__v');
  res.json(envVars);
});

export {
  getEnvVars,
  setEnvVarHandler,
  updateEnvVar,
  deleteEnvVar,
  getEnvVarsByCategory
};
