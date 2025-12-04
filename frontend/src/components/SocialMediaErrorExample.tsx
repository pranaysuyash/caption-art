/**
 * Example component demonstrating error handling for social media posting
 */

import React, { useState } from 'react';
import './SocialMediaErrorExample.css';
import {
  platformManager,
  errorHandler,
  type PostResult,
  type ErrorHandlingResult,
  type ShareablePlatform,
} from '../lib/social';
import { safeLocalStorage } from '../lib/storage/safeLocalStorage';

export const SocialMediaErrorExample: React.FC = () => {
  const [errorResult, setErrorResult] = useState<ErrorHandlingResult | null>(
    null
  );
  const [postResult, setPostResult] = useState<PostResult | null>(null);

  const simulateAuthError = async () => {
    // Clear auth to simulate authentication error - use safeLocalStorage wrapper
    safeLocalStorage.removeItem('instagram_auth_token');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;

    const prepared = await platformManager.prepareImageForPosting(
      canvas,
      'instagram'
    );
    const result = await platformManager.postToPlatform(
      'instagram',
      prepared,
      'Test caption',
      ['#test']
    );

    setPostResult(result);
    if (result.errorDetails) {
      setErrorResult(result.errorDetails);
    }
  };

  const simulateImageSizeError = async () => {
    // Create a large canvas to simulate size error
    const canvas = document.createElement('canvas');
    canvas.width = 5000;
    canvas.height = 5000;

    try {
      await platformManager.prepareImageForPosting(canvas, 'instagram');
    } catch (error) {
      const result = errorHandler.handleError(error as Error, 'instagram');
      setErrorResult(result);
    }
  };

  const simulateRateLimitError = () => {
    const error = new Error('Rate limit exceeded - 429');
    const result = errorHandler.handleError(error, 'twitter', async () => {
      console.log('Retrying after rate limit...');
    });
    setErrorResult(result);
  };

  const simulateNetworkError = () => {
    const error = new Error('Network connection failed');
    const result = errorHandler.handleError(error, 'facebook', async () => {
      console.log('Retrying after network error...');
    });
    setErrorResult(result);
  };

  const simulateUnknownError = () => {
    const error = new Error('Something unexpected happened');
    const result = errorHandler.handleError(error, 'pinterest');
    setErrorResult(result);
  };

  return (
    <div className='social-media-error-example'>
      <h2>Social Media Error Handling Examples</h2>

      <div className='actions'>
        <h3>Simulate Errors:</h3>
        <div className='controls'>
          <button onClick={simulateAuthError}>Authentication Error</button>
          <button onClick={simulateImageSizeError}>Image Size Error</button>
          <button onClick={simulateRateLimitError}>Rate Limit Error</button>
          <button onClick={simulateNetworkError}>Network Error</button>
          <button onClick={simulateUnknownError}>Unknown Error</button>
        </div>
      </div>

      {errorResult && (
        <div className='error-box'>
          <h3>Error Details</h3>
          <p>
            <strong>Type:</strong> {errorResult.type}
          </p>
          <p>
            <strong>Platform:</strong> {errorResult.platform}
          </p>
          <p>
            <strong>Message:</strong> {errorResult.message}
          </p>
          <p>
            <strong>User Message:</strong> {errorResult.userMessage}
          </p>
          <p>
            <strong>Can Retry:</strong> {errorResult.canRetry ? 'Yes' : 'No'}
          </p>
          {errorResult.retryDelay !== undefined && (
            <p>
              <strong>Retry Delay:</strong> {errorResult.retryDelay}ms
            </p>
          )}
          {errorResult.supportContact && (
            <p>
              <strong>Support Contact:</strong> {errorResult.supportContact}
            </p>
          )}

          <div className='available-actions'>
            <h4>Available Actions:</h4>
            <div className='controls'>
              {errorResult.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.action()}
                  className={`action-button ${
                    action.isPrimary ? 'primary' : 'secondary'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {postResult && (
        <div className='post-result-box'>
          <h3>Post Result</h3>
          <p>
            <strong>Success:</strong> {postResult.success ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Platform:</strong> {postResult.platform}
          </p>
          {postResult.postUrl && (
            <p>
              <strong>Post URL:</strong>{' '}
              <a
                href={postResult.postUrl}
                target='_blank'
                rel='noopener noreferrer'
              >
                {postResult.postUrl}
              </a>
            </p>
          )}
          {postResult.error && (
            <p>
              <strong>Error:</strong> {postResult.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
