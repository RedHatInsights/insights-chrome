import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

type TestUpdate = {
  testId: string;
  file: string;
  script: string;
};

type Options = {
  tests: TestUpdate[];
  field: string;
  dryRun: boolean;
};

const usage = `Usage:
  npm run catchpoint:upload [--manifest <file>] [--test <id>=<file> ...] [--field <json-path>] [--dry-run]

Options:
  --manifest   JSON file containing test ID/file mappings (default: catchpoint/upload-manifest.json).
  --test       Map an existing Catchpoint test ID to a local script file. Repeat to override the manifest.
  --field      JSON path for the Playwright script field (default: /script).
  --dry-run    Validate mappings and show which tests would be updated without calling Catchpoint.
  --help       Show this help.

The Catchpoint CLI must be installed and available as catchpoint-cli (or set CATCHPOINT_CLI).
Set CATCHPOINT_API_TOKEN in the environment; the CLI reads it from there.
`;

function parseArgs(args: string[]): Options {
  const tests: TestUpdate[] = [];
  let field = '/script';
  let dryRun = false;
  let manifest = 'catchpoint/upload-manifest.json';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(usage);
      process.exit(0);
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--test' || arg === '--field' || arg === '--manifest') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Expected a value after ${arg}.`);
      }
      index += 1;
      if (arg === '--field') {
        field = value;
      } else if (arg === '--manifest') {
        manifest = value;
      } else {
        const separatorIndex = value.indexOf('=');
        if (separatorIndex < 1 || separatorIndex === value.length - 1) {
          throw new Error(`Invalid test mapping "${value}". Expected <test-id>=<file>.`);
        }
        tests.push({ testId: value.slice(0, separatorIndex), file: value.slice(separatorIndex + 1), script: '' });
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (!field.startsWith('/') || field === '/') {
    throw new Error('--field must be a JSON path beginning with /, such as /script.');
  }

  if (tests.length === 0) {
    const manifestFile = resolve(process.cwd(), manifest);
    const parsedManifest: unknown = JSON.parse(readFileSync(manifestFile, 'utf8'));
    if (!Array.isArray(parsedManifest) || parsedManifest.length === 0) {
      throw new Error(`Upload manifest must be a non-empty JSON array: ${manifestFile}`);
    }
    for (const [index, entry] of parsedManifest.entries()) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        !('testId' in entry) ||
        typeof entry.testId !== 'string' ||
        !('file' in entry) ||
        typeof entry.file !== 'string'
      ) {
        throw new Error(`Invalid mapping at index ${index} in ${manifestFile}; expected { "testId", "file" }.`);
      }
      tests.push({ testId: entry.testId, file: entry.file, script: '' });
    }
  }

  const seenTestIds = new Set<string>();
  for (const test of tests) {
    if (!/^\d+$/.test(test.testId) || Number(test.testId) < 1) {
      throw new Error(`Invalid Catchpoint test ID: ${test.testId}`);
    }
    if (seenTestIds.has(test.testId)) {
      throw new Error(`Catchpoint test ID ${test.testId} was specified more than once.`);
    }
    seenTestIds.add(test.testId);
    test.file = resolve(process.cwd(), test.file);
    test.script = readFileSync(test.file, 'utf8');
    if (!test.script.trim()) {
      throw new Error(`Script file is empty: ${test.file}`);
    }
  }

  return { tests, field, dryRun };
}

function main() {
  const { tests, field, dryRun } = parseArgs(process.argv.slice(2));
  const cli = process.env.CATCHPOINT_CLI || 'catchpoint-cli';

  if (!dryRun && !process.env.CATCHPOINT_API_TOKEN) {
    throw new Error('Set CATCHPOINT_API_TOKEN in the environment before uploading.');
  }

  for (const { testId, file, script } of tests) {
    if (dryRun) {
      process.stdout.write(`Would update test ${testId} from ${file} at ${field}.\n`);
      continue;
    }

    process.stdout.write(`Updating Catchpoint test ${testId} from ${file}...\n`);
    const result = spawnSync(cli, ['test', 'update', '--test-id', testId, '--path', field, '--value', script], {
      stdio: 'inherit',
      env: process.env,
    });

    if (result.error) {
      throw new Error(`Could not run ${cli}: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`Catchpoint update failed for test ${testId} (exit code ${result.status ?? 'unknown'}).`);
    }
  }

  if (!dryRun) {
    process.stdout.write(`Updated ${tests.length} Catchpoint test${tests.length === 1 ? '' : 's'}.\n`);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${usage}`);
  process.exitCode = 1;
}
