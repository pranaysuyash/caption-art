/**
 * Tests for Social Media UI Components
 * Basic rendering tests to ensure components work correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformSelector } from './PlatformSelector';
import { HashtagSelector } from './HashtagSelector';
import { SchedulePicker } from './SchedulePicker';
import { MultiPlatformPostSummary } from './MultiPlatformPostSummary';
import { PlatformPresetSelector } from './PlatformPresetSelector';
import type { MultiPlatformResult } from '../lib/social/types';

describe('PlatformSelector', () => {
  it('should render platform selector', () => {
    const onSelectionChange = vi.fn();
    render(
      <PlatformSelector
        selectedPlatforms={[]}
        onSelectionChange={onSelectionChange}
        multiSelect={true}
      />
    );

    expect(screen.getByText('Select Platforms')).toBeDefined();
  });

  it('should display all platforms', () => {
    const onSelectionChange = vi.fn();
    render(
      <PlatformSelector
        selectedPlatforms={[]}
        onSelectionChange={onSelectionChange}
        multiSelect={true}
      />
    );

    expect(screen.getByText('Instagram')).toBeDefined();
    expect(screen.getByText('Twitter')).toBeDefined();
    expect(screen.getByText('Facebook')).toBeDefined();
    expect(screen.getByText('Pinterest')).toBeDefined();
  });
});

describe('HashtagSelector', () => {
  it('should render hashtag selector', () => {
    const onHashtagsChange = vi.fn();
    render(
      <HashtagSelector selectedHashtags={[]} onHashtagsChange={onHashtagsChange} />
    );

    expect(screen.getByText('Hashtags')).toBeDefined();
  });

  it('should display selected hashtags', () => {
    const onHashtagsChange = vi.fn();
    render(
      <HashtagSelector
        selectedHashtags={['#test', '#demo']}
        onHashtagsChange={onHashtagsChange}
      />
    );

    expect(screen.getByText('#test')).toBeDefined();
    expect(screen.getByText('#demo')).toBeDefined();
  });
});

describe('SchedulePicker', () => {
  it('should render schedule picker', () => {
    const onScheduleChange = vi.fn();
    render(
      <SchedulePicker scheduledTime={null} onScheduleChange={onScheduleChange} />
    );

    expect(screen.getByText('Schedule for later')).toBeDefined();
  });

  it('should show datetime input when enabled', () => {
    const onScheduleChange = vi.fn();
    render(
      <SchedulePicker
        scheduledTime={new Date()}
        onScheduleChange={onScheduleChange}
        enabled={true}
      />
    );

    expect(screen.getByLabelText('Select date and time')).toBeDefined();
  });
});

describe('MultiPlatformPostSummary', () => {
  it('should render post summary', () => {
    const result: MultiPlatformResult = {
      results: [
        {
          success: true,
          platform: 'instagram',
          postUrl: 'https://instagram.com/post/123',
        },
      ],
      successCount: 1,
      failureCount: 0,
      totalPlatforms: 1,
    };

    render(<MultiPlatformPostSummary result={result} />);

    expect(screen.getByText('Post Summary')).toBeDefined();
    expect(screen.getByText('1 Successful')).toBeDefined();
  });

  it('should display failed posts', () => {
    const result: MultiPlatformResult = {
      results: [
        {
          success: false,
          platform: 'twitter',
          error: 'Authentication failed',
        },
      ],
      successCount: 0,
      failureCount: 1,
      totalPlatforms: 1,
    };

    render(<MultiPlatformPostSummary result={result} />);

    expect(screen.getByText('1 Failed')).toBeDefined();
    expect(screen.getByText('Authentication failed')).toBeDefined();
  });
});

describe('PlatformPresetSelector', () => {
  it('should render preset selector', () => {
    const onPlatformChange = vi.fn();
    const onPresetSelect = vi.fn();

    render(
      <PlatformPresetSelector
        selectedPlatform={null}
        onPlatformChange={onPlatformChange}
        onPresetSelect={onPresetSelect}
      />
    );

    expect(screen.getByText('Platform Size Presets')).toBeDefined();
  });

  it('should display platform tabs', () => {
    const onPlatformChange = vi.fn();
    const onPresetSelect = vi.fn();

    render(
      <PlatformPresetSelector
        selectedPlatform={null}
        onPlatformChange={onPlatformChange}
        onPresetSelect={onPresetSelect}
      />
    );

    expect(screen.getByText('Instagram')).toBeDefined();
    expect(screen.getByText('Twitter')).toBeDefined();
    expect(screen.getByText('Facebook')).toBeDefined();
    expect(screen.getByText('Pinterest')).toBeDefined();
  });
});
