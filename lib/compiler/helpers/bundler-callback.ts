import { ERROR_PREFIX } from '../../ui/index.js';
import type { AssetsManager } from '../assets-manager.js';

export interface BundlerStats {
  hasErrors(): boolean;
  toString(options: {
    chunks: boolean;
    colors: boolean;
    modules: boolean;
    assets: boolean;
  }): string;
}

export interface BundlerCallbackCompletion {
  resolve: () => void;
  reject: (err: unknown) => void;
}

export interface BundlerAfterCallbackOptions {
  bundlerName: string;
  onSuccess: (() => void) | undefined;
  assetsManager: AssetsManager;
  watchMode: boolean;
  watch: boolean | undefined;
  onComplete?: BundlerCallbackCompletion;
}

/**
 * Creates the completion callback shared by `RspackCompiler` and
 * `WebpackCompiler` for both `compiler.run()` and `compiler.watch()`.
 */
export function createBundlerAfterCallback({
  bundlerName,
  onSuccess,
  assetsManager,
  watchMode,
  watch,
  onComplete,
}: BundlerAfterCallbackOptions) {
  const closeWatchersSafely = async () => {
    try {
      await assetsManager.closeWatchers();
    } catch (error: unknown) {
      console.error(
        `${ERROR_PREFIX} Failed to close asset watchers. ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (err: Error | null | undefined, stats: BundlerStats | undefined) => {
    const isWatch = watchMode || !!watch;
    if (err && stats === undefined) {
      // Could not complete the compilation
      // The error caught is most likely thrown by underlying tasks
      console.log(err);
      if (isWatch) {
        // Both webpack and rspack stop watching without re-arming after a
        // fatal watch error; exit so watch mode does not stay up dead.
        return process.exit(1);
      }
      if (!onSuccess) {
        void closeWatchersSafely().finally(() => onComplete?.reject(err));
      } else {
        onComplete?.reject(err);
      }
      return;
    }

    const statsOutput = stats!.toString({
      chunks: false,
      colors: true,
      modules: false,
      assets: false,
    });

    if (!err && !stats!.hasErrors()) {
      if (onSuccess) {
        onSuccess();
      }
      console.log(statsOutput);
      if (!onSuccess && !isWatch) {
        // Bundlers ignore whatever this callback returns, so the close is
        // handled here while resolving the outer non-watch Promise once done.
        void closeWatchersSafely().finally(() => onComplete?.resolve());
      } else {
        onComplete?.resolve();
      }
      return;
    }

    console.log(statsOutput);
    if (!isWatch) {
      const failure = err ?? new Error(`${bundlerName} compilation failed.`);
      if (!onSuccess) {
        void closeWatchersSafely().finally(() => onComplete?.reject(failure));
      } else {
        onComplete?.reject(failure);
      }
    }
  };
}
