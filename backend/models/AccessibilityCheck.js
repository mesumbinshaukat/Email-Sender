import mongoose from 'mongoose';

const accessibilityCheckSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  accessibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  issues: [{
    type: {
      type: String,
      enum: ['missing_alt_text', 'poor_contrast', 'missing_lang_attr', 'empty_links', 'missing_headings', 'large_images', 'complex_tables', 'no_semantic_html', 'keyboard_navigation', 'color_only_meaning'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['error', 'warning', 'info'],
      required: true,
    },
    element: String,
    line: Number,
    message: {
      type: String,
      required: true,
    },
    suggestion: String,
    wcagGuideline: String,
  }],
  checksPerformed: {
    altTextCheck: { type: Boolean, default: false },
    contrastCheck: { type: Boolean, default: false },
    headingStructureCheck: { type: Boolean, default: false },
    linkAccessibilityCheck: { type: Boolean, default: false },
    imageOptimizationCheck: { type: Boolean, default: false },
    semanticHtmlCheck: { type: Boolean, default: false },
    colorAccessibilityCheck: { type: Boolean, default: false },
    keyboardNavigationCheck: { type: Boolean, default: false },
    languageAttributeCheck: { type: Boolean, default: false },
  },
  recommendations: [{
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
    category: String,
    title: String,
    description: String,
    implementation: String,
  }],
  complianceLevel: {
    type: String,
    enum: ['A', 'AA', 'AAA'],
    default: 'A',
  },
  estimatedFixTime: {
    type: Number, // in minutes
    default: 0,
  },
  aiSuggestions: [{
    type: {
      type: String,
      enum: ['alt_text_generation', 'color_improvement', 'structure_fix', 'content_improvement'],
    },
    content: String,
    confidence: Number,
    applied: { type: Boolean, default: false },
  }],
}, {
  timestamps: true,
});

// Indexes
accessibilityCheckSchema.index({ userId: 1, createdAt: -1 });
accessibilityCheckSchema.index({ emailId: 1 });
accessibilityCheckSchema.index({ accessibilityScore: -1 });

const AccessibilityCheck = mongoose.model('AccessibilityCheck', accessibilityCheckSchema);

export default AccessibilityCheck;
