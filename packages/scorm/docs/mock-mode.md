# Testing with Mock Mode

## Overview

When developing or testing locally (outside an LMS), no SCORM API object exists on the window. The library's **mock mode** provides an in-memory SCORM API that behaves identically to a real LMS.

## Enabling Mock Mode

Set `noLmsBehavior: 'mock'` on the provider:

```tsx
<ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
  <App />
</ScormProvider>
```

With mock mode:
- `status.apiFound` is `true`
- `api` is fully functional
- All values are stored in an in-memory `Map`
- Call sequences are validated (initialize before get/set, etc.)
- SCORM error codes are returned correctly

## How It Works

The mock creates a `MockScorm12Api` or `MockScorm2004Api` instance and wraps it in the real `Scorm12Driver` or `Scorm2004Driver`. This means the same code path is exercised as with a real LMS — only the underlying API object is different.

## Using in Tests (Vitest / Jest)

### With ScormProvider

```tsx
import { render } from '@testing-library/react';
import { ScormProvider } from '@studiolxd/react-scorm';

render(
  <ScormProvider version="2004" options={{ noLmsBehavior: 'mock' }}>
    <ComponentUnderTest />
  </ScormProvider>
);
```

### Without React (direct mock usage)

```ts
import {
  MockScorm12Api,
  Scorm12Driver,
  ScormApi,
  createLogger,
} from '@studiolxd/react-scorm';

const mockApi = new MockScorm12Api();
const driver = new Scorm12Driver(mockApi, createLogger(false));
const api = new ScormApi(driver);

// Initialize
api.initialize();

// Your test logic
api.setScore({ raw: 85, min: 0, max: 100 });
api.setComplete();
api.commit();

// Verify stored values
const store = mockApi._getStore();
expect(store.get('cmi.core.score.raw')).toBe('85');
expect(store.get('cmi.core.lesson_status')).toBe('completed');

// Terminate
api.terminate();
```

### Test Helpers

The mock APIs expose helpers prefixed with `_`:

| Method | Description |
|--------|-------------|
| `_reset()` | Clear all state (store, initialized, terminated) |
| `_getStore()` | Get a copy of the internal key-value store |
| `_setError(code)` | Force a specific error code for the next operation |
| `_isInitialized()` | Check if currently in initialized state |
| `_isTerminated()` | Check if session has been terminated |

## noLmsBehavior Options

| Value | When to Use |
|-------|-------------|
| `"error"` (default) | Production. `api` is `null` if no LMS found. Your app handles the absence. |
| `"mock"` | Development / testing. Everything works against an in-memory store. |
| `"throw"` | CI/strict environments. Throws immediately if no LMS is present. |

## Switching Between Modes

A common pattern is to use environment variables:

```tsx
const noLmsBehavior = import.meta.env.DEV ? 'mock' : 'error';

<ScormProvider version="1.2" options={{ noLmsBehavior }}>
  <App />
</ScormProvider>
```
