import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScormProvider } from '../../src/react/scorm-provider';
import { useScorm } from '../../src/react/use-scorm';

function StatusDisplay() {
  const { status, api } = useScorm();
  return (
    <div>
      <span data-testid="apiFound">{String(status.apiFound)}</span>
      <span data-testid="version">{status.version}</span>
      <span data-testid="hasApi">{String(api !== null)}</span>
      <span data-testid="noLmsBehavior">{status.noLmsBehavior}</span>
    </div>
  );
}

describe('ScormProvider', () => {
  it('renders children', () => {
    render(
      <ScormProvider version="1.2">
        <span>child content</span>
      </ScormProvider>,
    );
    expect(screen.getByText('child content')).toBeDefined();
  });

  it('with noLmsBehavior="error" (default): apiFound=false, api=null', () => {
    render(
      <ScormProvider version="1.2">
        <StatusDisplay />
      </ScormProvider>,
    );
    expect(screen.getByTestId('apiFound').textContent).toBe('false');
    expect(screen.getByTestId('hasApi').textContent).toBe('false');
    expect(screen.getByTestId('noLmsBehavior').textContent).toBe('error');
  });

  it('with noLmsBehavior="mock": apiFound=true, api is functional', () => {
    render(
      <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
        <StatusDisplay />
      </ScormProvider>,
    );
    expect(screen.getByTestId('apiFound').textContent).toBe('true');
    expect(screen.getByTestId('hasApi').textContent).toBe('true');
    expect(screen.getByTestId('version').textContent).toBe('1.2');
  });

  it('with noLmsBehavior="mock" and version="2004"', () => {
    render(
      <ScormProvider version="2004" options={{ noLmsBehavior: 'mock' }}>
        <StatusDisplay />
      </ScormProvider>,
    );
    expect(screen.getByTestId('apiFound').textContent).toBe('true');
    expect(screen.getByTestId('version').textContent).toBe('2004');
  });

  it('with noLmsBehavior="throw": throws error', () => {
    // Suppress console.error from React's error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(
        <ScormProvider version="1.2" options={{ noLmsBehavior: 'throw' }}>
          <StatusDisplay />
        </ScormProvider>,
      );
    }).toThrow('SCORM API not found');
    spy.mockRestore();
  });
});
