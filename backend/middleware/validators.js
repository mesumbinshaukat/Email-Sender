import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const emailValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('recipients.to')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.to.*').isEmail().withMessage('Invalid recipient email'),
  body('body.html').optional().trim(),
  body('body.text').optional().trim(),
];

export const smtpValidation = [
  body('host').trim().notEmpty().withMessage('SMTP host is required'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port number'),
  body('user').trim().notEmpty().withMessage('SMTP user is required'),
  body('password').trim().notEmpty().withMessage('SMTP password is required'),
];
