import mongoose from 'mongoose';

const environmentVariableSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['api_keys', 'database', 'smtp', 'integrations'],
    default: 'api_keys'
  },
  isEncrypted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const EnvironmentVariable = mongoose.model('EnvironmentVariable', environmentVariableSchema);

export default EnvironmentVariable;
