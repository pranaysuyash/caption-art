import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceDashboard } from './PerformanceDashboard';
import * as monitoring from '../lib/monitoring';

// Mock the monitoring module
vi.mock('../lib/monitoring', () => ({
  getWebVitalsTracker: vi.fn(),
  getAPIMonitor: vi.fn(),
  getErrorRateTracker: vi.fn(),
  getResourceMonitor: vi.fn(),
  getExecutionTracker: vi.fn(),
  getMemoryMonitor: vi.fn(),
}));

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    render(<PerformanceDashboard />);
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
  });

  it('renders time range selector', () => {
    render(<PerformanceDashboard />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Last Hour')).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<PerformanceDashboard />);
    expect(screen.getByText('Export Report')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<PerformanceDashboard />);
    
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(b => b.textContent);
    
    expect(buttonTexts).toContain('Overview');
    expect(buttonTexts).toContain('Web Vitals');
    expect(buttonTexts).toContain('API Performance');
    expect(buttonTexts).toContain('Errors');
    expect(buttonTexts).toContain('Resources');
    expect(buttonTexts).toContain('Execution');
    expect(buttonTexts).toContain('Memory');
  });

  it('switches views when navigation buttons are clicked', () => {
    render(<PerformanceDashboard />);
    
    const webVitalsButton = screen.getByText('Web Vitals');
    fireEvent.click(webVitalsButton);
    
    expect(webVitalsButton).toHaveClass('active');
  });

  it('displays web vitals metrics when available', () => {
    const mockTracker = {
      getMetrics: vi.fn(() => [
        { name: 'LCP', value: 2000, rating: 'good', timestamp: Date.now() },
        { name: 'FID', value: 50, rating: 'good', timestamp: Date.now() },
        { name: 'CLS', value: 0.05, rating: 'good', timestamp: Date.now() },
      ]),
    };

    vi.mocked(monitoring.getWebVitalsTracker).mockReturnValue(mockTracker as any);

    render(<PerformanceDashboard />);
    
    // Wait for metrics to load
    setTimeout(() => {
      expect(screen.getByText('LCP')).toBeInTheDocument();
      expect(screen.getByText('FID')).toBeInTheDocument();
      expect(screen.getByText('CLS')).toBeInTheDocument();
    }, 100);
  });

  it('displays API metrics when available', () => {
    const mockMonitor = {
      getMetrics: vi.fn(() => []),
      calculatePercentiles: vi.fn(() => ({ p50: 100, p95: 500, p99: 1000 })),
    };

    vi.mocked(monitoring.getAPIMonitor).mockReturnValue(mockMonitor as any);

    render(<PerformanceDashboard />);
    
    setTimeout(() => {
      expect(mockMonitor.calculatePercentiles).toHaveBeenCalled();
    }, 100);
  });

  it('displays error stats when available', () => {
    const mockTracker = {
      calculateErrorRate: vi.fn(() => ({
        totalRequests: 100,
        totalErrors: 5,
        errorRate: 5,
        errorsByType: { network: 2, api: 2, client: 1 },
      })),
    };

    vi.mocked(monitoring.getErrorRateTracker).mockReturnValue(mockTracker as any);

    render(<PerformanceDashboard />);
    
    setTimeout(() => {
      expect(mockTracker.calculateErrorRate).toHaveBeenCalled();
    }, 100);
  });

  it('exports report when export button is clicked', () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    });

    render(<PerformanceDashboard />);
    
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    expect(createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('changes time range when selector is changed', () => {
    render(<PerformanceDashboard />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'day' } });
    
    expect(select).toHaveValue('day');
  });

  it('handles missing monitoring services gracefully', () => {
    vi.mocked(monitoring.getWebVitalsTracker).mockReturnValue(null);
    vi.mocked(monitoring.getAPIMonitor).mockReturnValue(null);
    vi.mocked(monitoring.getErrorRateTracker).mockReturnValue(null);
    vi.mocked(monitoring.getResourceMonitor).mockReturnValue(null);
    vi.mocked(monitoring.getExecutionTracker).mockReturnValue(null);
    vi.mocked(monitoring.getMemoryMonitor).mockReturnValue(null);

    const { container } = render(<PerformanceDashboard />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
  });

  it('refreshes metrics at specified interval', () => {
    vi.useFakeTimers();

    const mockTracker = {
      getMetrics: vi.fn(() => []),
    };

    vi.mocked(monitoring.getWebVitalsTracker).mockReturnValue(mockTracker as any);

    render(<PerformanceDashboard refreshInterval={1000} />);
    
    expect(mockTracker.getMetrics).toHaveBeenCalledTimes(1);
    
    vi.advanceTimersByTime(1000);
    expect(mockTracker.getMetrics).toHaveBeenCalledTimes(2);
    
    vi.advanceTimersByTime(1000);
    expect(mockTracker.getMetrics).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
