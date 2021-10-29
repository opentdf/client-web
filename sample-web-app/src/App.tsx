import React, { useState, useEffect } from 'react';
import './App.css';

import { sum } from '@opentdf/client/sum.js';
import { fromBrowserFile } from '@opentdf/client/chunkers.js';

interface AppProps {}

function toHex(a: Uint8Array) {
  return [...a].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function App({}: AppProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [segments, setSegments] = useState('');

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      const [file] = target.files;
      setSelectedFile(file);
      setIsFilePicked(true);
    }
  };

  const handleSubmission = async () => {
    if (!selectedFile) {
      return;
    }
    setSegments('[THINKING]');
    const chunker = await fromBrowserFile(selectedFile);
    const start = await chunker(0, 10);
    const end = await chunker(-10);
    console.log('Success:', start, end);
    setSegments(`start: ${toHex(start)}; end: ${toHex(end)}`);
  };

  // Create the count state.
  const [count, setCount] = useState(0);
  // Create the counter (+1 every second).
  useEffect(() => {
    const timer = setTimeout(() => setCount(count + 1), 1000);
    return () => clearTimeout(timer);
  }, [count, setCount]);
  // Return the App component.
  return (
    <div className="App">
      <header className="App-header">
        <p>sum(1,2) = {sum(1, 2)}</p>
        <p>
          Page has been open for <code>{count}</code> seconds.
        </p>
      </header>
      <p>Select a file and submit to slice it.</p>
      <form>
        <label htmlFor="file-selector">Select file:</label>
        <input type="file" name="file" id="file-selector" onChange={changeHandler} />
        {selectedFile ? (
          <div>
            <h2>{selectedFile.name}</h2>
            <div>Content Type: {selectedFile.type}</div>
            <div>Last Modified: {new Date(selectedFile.lastModified).toLocaleString()}</div>
            <div>Size: {new Intl.NumberFormat().format(selectedFile.size)} bytes</div>
          </div>
        ) : (
          <p>Select a file to show details</p>
        )}
        {segments.length ? (
          <h3>{segments}</h3>
        ) : (
          <div>
            <button onClick={handleSubmission}>Process</button>
          </div>
        )}
      </form>
    </div>
  );
}

export default App;
