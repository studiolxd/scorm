# Integration Guide

How to use `@studiolxd/react-scorm` in a React app that will be packaged as a SCORM module by an external build process.

## Architecture

```
Your React App (Vite, CRA, Next.js, etc.)
    └── uses @studiolxd/react-scorm for SCORM communication
    └── builds to static HTML/JS/CSS

External SCORM Packager
    └── takes your build output
    └── adds imsmanifest.xml
    └── creates the SCORM .zip
```

This library handles **only runtime communication** with the LMS. It does NOT generate `imsmanifest.xml` or the SCORM zip package.

## Step 1: Install

```bash
npm install @studiolxd/react-scorm
```

## Step 2: Wrap Your App

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ScormProvider } from '@studiolxd/react-scorm';
import App from './App';

const scormVersion = '1.2';  // or '2004' — must match your imsmanifest.xml
const isDev = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScormProvider
      version={scormVersion}
      options={{
        noLmsBehavior: isDev ? 'mock' : 'error',
        debug: isDev,
      }}
    >
      <App />
    </ScormProvider>
  </StrictMode>
);
```

## Step 3: Use the Hook

```tsx
// App.tsx
import { useScorm, useScormAutoTerminate } from '@studiolxd/react-scorm';

function App() {
  const { api, status } = useScorm();
  useScormAutoTerminate({ trackSessionTime: true });

  if (!status.apiFound && status.noLmsBehavior === 'error') {
    return <p>This course must be launched from an LMS.</p>;
  }

  if (!api) return <p>Loading...</p>;

  const saveProgress = (page: number) => {
    api.setLocation(String(page));
    api.setSuspendData(JSON.stringify({ lastPage: page }));
    api.commit();
  };

  const completeLesson = () => {
    api.setScore({ raw: 100, min: 0, max: 100 });
    api.setComplete();
    api.setPassed();
    api.commit();
  };

  return (
    <div>
      <h1>My Course</h1>
      <button onClick={() => saveProgress(5)}>Save Progress</button>
      <button onClick={completeLesson}>Complete</button>
    </div>
  );
}
```

## Step 4: Build Configuration

### Vite

Make sure to use relative paths so the SCORM package works when hosted on any LMS:

```ts
// vite.config.ts
export default defineConfig({
  base: './',  // relative paths for SCORM
  build: {
    outDir: 'dist',
  },
});
```

### Output

Your build produces:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
```

## Step 5: Create SCORM Package

The SCORM zip needs:
1. Your build output (`index.html`, `assets/`, etc.)
2. An `imsmanifest.xml` file

### Example imsmanifest.xml (SCORM 1.2)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.studiolxd.mycourse" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>My Course</title>
      <item identifier="item1" identifierref="res1">
        <title>My Course</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
```

### Creating the Zip

```bash
cd dist
zip -r ../my-course-scorm.zip .
```

Or use a tool like `simple-scorm-packager`, `scorm-packager`, or any CI script.

## Manual Lifecycle (without useScormAutoTerminate)

If you need full control:

```tsx
function App() {
  const { api } = useScorm();
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!api) return;
    api.initialize();
    startTime.current = Date.now();

    return () => {
      const elapsed = Date.now() - startTime.current;
      api.setSessionTime(elapsed);
      api.commit();
      api.terminate();
    };
  }, [api]);

  // ...
}
```

## Restoring State on Resume

```tsx
function App() {
  const { api } = useScorm();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!api) return;
    api.initialize();

    // Restore location
    const locResult = api.getLocation();
    if (locResult.ok && locResult.value) {
      setPage(parseInt(locResult.value, 10));
    }

    // Restore custom data
    const dataResult = api.getSuspendData();
    if (dataResult.ok && dataResult.value) {
      const saved = JSON.parse(dataResult.value);
      // restore from saved...
    }
  }, [api]);

  // ...
}
```

## Error Handling Pattern

```tsx
function saveData(api: IScormApi) {
  const results = [
    api.setScore({ raw: 85 }),
    api.setComplete(),
    api.commit(),
  ];

  const failed = results.find(r => !r.ok);
  if (failed && !failed.ok) {
    console.error('SCORM save failed:', failed.error.errorString);
    // Optionally retry or notify user
  }
}
```
