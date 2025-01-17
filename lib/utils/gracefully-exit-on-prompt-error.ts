export function gracefullyExitOnPromptError(err: Error) {
  if (err.name === 'ExitPromptError') {
    process.exit(1);
  } else {
    throw err;
  }
}
