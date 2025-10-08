#!/usr/bin/env node

/**
 * Script to fix all controllers using OpenAI
 * Replaces hardcoded OpenAI initialization with dynamic helper
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const controllersToFix = [
  'staggeredSendController.js',
  'visualPersonalizationController.js',
  'zeroPartyController.js',
  'liquidController.js',
  'goalAutomationController.js',
  'crossChannelController.js',
  'ampController.js',
  'clvController.js'
];

const fixController = async (filename) => {
  const filePath = join('controllers', filename);
  
  try {
    let content = await readFile(filePath, 'utf-8');
    
    // Replace import and initialization
    content = content.replace(
      /import { OpenAI } from 'openai';\s*\nconst openai = new OpenAI\({ apiKey: process\.env\.OPENAI_API_KEY }\);/g,
      "import { getOpenAIClient } from '../utils/openaiHelper.js';"
    );
    
    // Find all async functions and add openai client initialization
    const functionRegex = /export const (\w+) = async \(req, res\) => \{\s*try \{/g;
    content = content.replace(functionRegex, (match, funcName) => {
      return `export const ${funcName} = async (req, res) => {\n  try {\n    const openai = await getOpenAIClient(req.user?._id);\n`;
    });
    
    // Add error handling for missing API key
    content = content.replace(
      /} catch \(error\) \{\s*res\.status\(500\)\.json\({ message: 'Server error', error: error\.message }\);\s*}/g,
      `} catch (error) {
    if (error.message.includes('API key not configured')) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key not configured',
        code: 'OPENAI_NOT_CONFIGURED',
        action: 'Please configure your OpenAI API key in settings'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }`
    );
    
    await writeFile(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error.message);
  }
};

const main = async () => {
  console.log('🔧 Fixing OpenAI controllers...\n');
  
  for (const controller of controllersToFix) {
    await fixController(controller);
  }
  
  console.log('\n✅ All controllers fixed!');
};

main();
