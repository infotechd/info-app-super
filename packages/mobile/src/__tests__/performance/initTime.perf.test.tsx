import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import App from '../../../App';

// Mock vector icons to avoid native dependency in Jest
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  return () => React.createElement('IconMock');
});

// Ensure reanimated mock is used (jest.setup also handles this, but keep redundancy for stability)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

/**
 * Performance test (Mobile): initial app render should complete and show main tabs within 3000ms.
 * Target per guidelines: Mobile init < 3s.
 */

describe('Mobile Performance - initialization time', () => {
  const TARGET_MS = 3000;

  it('App should render Main tabs within target time', async () => {
    const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

    render(<App />);

    // Wait until the main tabs label 'Ofertas' is visible
    await waitFor(async () => {
      expect(await screen.findByText('Ofertas')).toBeTruthy();
    }, { timeout: 5000 });

    const end = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const elapsedMs = end - start;

    // Assert meets target
    expect(elapsedMs).toBeLessThanOrEqual(TARGET_MS);
  });
});
