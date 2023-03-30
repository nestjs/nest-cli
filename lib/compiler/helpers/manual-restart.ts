export function listenForManualRestart(callback: () => void) {
  const stdinListener = (data: Buffer) => {
    if (data.toString().replace('\n', '') === 'rs') {
      process.stdin.removeListener('data', stdinListener);
      callback();
    }
  };
  process.stdin.on('data', stdinListener);
}
