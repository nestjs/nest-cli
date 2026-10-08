import { execSync, spawnSync } from 'child_process';

export function treeKillSync(pid: number, signal?: string | number): void {
  if (process.platform === 'win32') {
    taskkill(pid);
    return;
  }

  const children = getAllChildren(pid);
  children.forEach(function (pid) {
    killPid(pid, signal);
  });

  killPid(pid, signal);
  return;
}

function getAllPid(): {
  pid: number;
  ppid: number;
}[] {
  const result = spawnSync('ps', ['-A', '-o', 'pid,ppid'], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  if (result.error || !result.stdout) {
    return [];
  }

  const rows = result.stdout.trim().split('\n').slice(1);

  return rows
    .map(function (row) {
      const parts = row.match(/\s*(\d+)\s*(\d+)/);

      if (parts === null) {
        return null;
      }

      return {
        pid: Number(parts[1]),
        ppid: Number(parts[2]),
      };
    })
    .filter(<T>(input: null | undefined | T): input is T => {
      return input != null;
    });
}

function getAllChildren(pid: number) {
  const allpid = getAllPid();

  const ppidHash: {
    [key: number]: number[];
  } = {};

  const result: number[] = [];

  allpid.forEach(function (item) {
    ppidHash[item.ppid] = ppidHash[item.ppid] || [];
    ppidHash[item.ppid].push(item.pid);
  });

  const find = function (pid: number) {
    ppidHash[pid] = ppidHash[pid] || [];
    ppidHash[pid].forEach(function (childPid) {
      result.push(childPid);
      find(childPid);
    });
  };

  find(pid);
  return result;
}

function killPid(pid: number, signal?: string | number) {
  try {
    process.kill(pid, signal);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ESRCH') {
      throw err;
    }
  }
}

// taskkill exits with 128 when the process is gone already, for example
// when Ctrl+C reached every process attached to the console.
const TASKKILL_PROCESS_NOT_FOUND = 128;

function taskkill(pid: number) {
  try {
    execSync('taskkill /pid ' + pid + ' /T /F', { stdio: 'pipe' });
  } catch (err) {
    if (!isProcessNotFound(err)) {
      throw err;
    }
  }
}

function isProcessNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    err.status === TASKKILL_PROCESS_NOT_FOUND
  );
}
