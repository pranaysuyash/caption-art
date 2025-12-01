# Visual Regression Testing

This directory contains visual regression tests for the app layout restructure feature.

## Overview

Visual regression tests capture screenshots of the application at different viewport sizes and states, then compare them against baseline images to detect unintended visual changes.

## Running Tests

### Prerequisites

1. Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Run Visual Tests

```bash
# Run all visual regression tests
npm run test:visual

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test VisualRegression.visual.test.ts

# Run tests in debug mode
npx playwright test --debug
```

### Update Baseline Screenshots

When you intentionally change the UI, update the baseline screenshots:

```bash
npm run test:visual:update
```

## Test Coverage

The visual regression tests cover:

### Viewport Sizes (Requirements 5.1, 5.2, 5.3)
- 320px (mobile)
- 768px (tablet)
- 1024px (desktop)
- 1920px (large desktop)

### Layout States (Requirement 6.1)
- Sidebar expanded
- Sidebar collapsed
- Mobile with sidebar toggle
- Fullscreen mode

### Content States
- No image (initial state)
- With image uploaded
- With image and text
- Progressive disclosure states

### Theme Variations
- Light theme
- Dark theme

### Animation States
- Before sidebar toggle
- After sidebar toggle

## Screenshot Storage

Baseline screenshots are stored in:
```
frontend/src/components/layout/__screenshots__/
```

Test results and diffs are stored in:
```
frontend/playwright-report/
frontend/test-results/
```

## CI/CD Integration

Visual regression tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run visual regression tests
  run: npm run test:visual

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests Failing After UI Changes

If tests fail after intentional UI changes:
1. Review the diff images in `test-results/`
2. If changes are correct, update baselines: `npm run test:visual:update`
3. Commit the new baseline screenshots

### Flaky Tests

If tests are flaky:
1. Increase wait times in the test
2. Disable animations: `animations: 'disabled'`
3. Use `waitForLoadState('networkidle')`

### Different Screenshots on Different Machines

Playwright screenshots can vary slightly between:
- Different operating systems
- Different screen resolutions
- Different font rendering

For consistent results:
- Run tests in Docker
- Use CI/CD for baseline generation
- Configure pixel threshold: `threshold: 0.2`

## Best Practices

1. **Disable Animations**: Use `animations: 'disabled'` for consistent screenshots
2. **Wait for Stability**: Use `waitForLoadState('networkidle')` before capturing
3. **Full Page Screenshots**: Use `fullPage: true` to capture entire layout
4. **Meaningful Names**: Use descriptive screenshot names
5. **Update Baselines Carefully**: Review diffs before updating baselines

## Performance Considerations

Visual regression tests are slower than unit tests because they:
- Start a real browser
- Load the full application
- Capture and compare screenshots

Run them:
- Before merging PRs
- After significant UI changes
- In CI/CD pipelines

Don't run them:
- During active development (use unit tests instead)
- For every file save (too slow)

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Visual Regression Testing Guide](https://playwright.dev/docs/test-snapshots)
- [App Layout Design Document](../../.kiro/specs/app-layout-restructure/design.md)
