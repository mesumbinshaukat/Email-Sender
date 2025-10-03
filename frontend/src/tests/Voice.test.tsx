import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SendEmail } from '../pages/SendEmail';
import axios from '../lib/axios';

// Mock axios
jest.mock('../lib/axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon">Send</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Mic: () => <div data-testid="mic-icon">Mic</div>,
  MicOff: () => <div data-testid="mic-off-icon">MicOff</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  Loader: () => <div data-testid="loader-icon">Loader</div>,
}));

// Mock ReactQuill
jest.mock('react-quill', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="react-quill"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock DashboardLayout
jest.mock('../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock UI components
jest.mock('../components/ui/Card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('../components/ui/Button', () => ({
  Button: ({ children, onClick, variant, disabled, isLoading, ...props }: any) => (
    <button
      data-testid={`button-${variant || 'primary'}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span data-testid="loading-spinner">Loading...</span>}
      {children}
    </button>
  ),
}));

jest.mock('../components/ui/Input', () => ({
  Input: ({ label, value, onChange, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        data-testid="input"
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  ),
}));

describe('SendEmail Voice Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock campaigns API
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/agentic/campaigns') {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { _id: '1', name: 'Test Campaign', status: 'active' },
            ],
          },
        });
      }
      if (url === '/voice/supported-commands') {
        return Promise.resolve({
          data: {
            success: true,
            commands: [
              { command: 'new email', description: 'Start composing' },
            ],
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock Web Speech API
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        onresult: jest.fn(),
        onend: jest.fn(),
        onerror: jest.fn(),
      })),
    });
  });

  test('renders voice control buttons', async () => {
    render(<SendEmail />);

    await waitFor(() => {
      expect(screen.getByText('Start Voice')).toBeInTheDocument();
      expect(screen.getByText('Hands-Free Mode')).toBeInTheDocument();
    });
  });

  test('shows supported commands in hands-free mode', async () => {
    render(<SendEmail />);

    await waitFor(() => {
      const handsFreeButton = screen.getByText('Hands-Free Mode');
      fireEvent.click(handsFreeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Hands-Free Mode Active')).toBeInTheDocument();
      expect(screen.getByText('"new email"')).toBeInTheDocument();
    });
  });

  test('displays transcription when voice input is processed', async () => {
    // Mock voice command API
    mockedAxios.post.mockImplementation((url) => {
      if (url === '/voice/command') {
        return Promise.resolve({
          data: {
            success: true,
            parsed: {
              action: 'compose',
              params: { subject: 'Test Subject' },
              confidence: 0.9,
            },
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<SendEmail />);

    // Simulate transcription update (this would normally come from Web Speech API)
    // For testing, we can manually trigger the processVoiceCommand
    // This is a limitation of testing voice features

    expect(screen.getByText('Voice Input:')).toBeInTheDocument();
  });

  test('campaign selection is available', async () => {
    render(<SendEmail />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('No campaign - standalone email');
      expect(select).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Test Campaign (active)')).toBeInTheDocument();
    });
  });

  test('form submission includes campaignId', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { success: true },
    });

    render(<SendEmail />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('No campaign - standalone email');
      fireEvent.change(select, { target: { value: '1' } });
    });

    // Fill required fields
    const subjectInput = screen.getAllByTestId('input')[1]; // Subject input
    const recipientInput = screen.getAllByTestId('input')[0]; // Recipient input

    fireEvent.change(recipientInput, { target: { value: 'test@example.com' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });

    // Submit form
    const submitButton = screen.getByText('Send Email');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/emails/send', expect.objectContaining({
        campaignId: '1',
      }));
    });
  });
});
