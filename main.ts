// Driver for the markdown-render-speed-02 entry.
//
// The harness runs `node /bot/main.ts`. It hands us a directory of cases
// and expects one HTML string per case, in order, in an output file:
//   input : <INPUT_DIR>/cases.json  — JSON array of { id, markdown }
//   output: <OUTPUT_DIR>/html.json — JSON array of HTML strings
// Each case is rendered alone, with a fresh call to parse(), so no state
// leaks from one case into the next. The input/output directories default
// to /input and /output; MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR override
// them when running outside the harness container.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

type Case = { id: string; markdown: string };

function main(): void {
  const cases = JSON.parse(readFileSync(join(INPUT_DIR, 'cases.json'), 'utf8')) as Case[];
  const html: string[] = new Array(cases.length);
  for (let k = 0; k < cases.length; k++) {
    html[k] = parse(cases[k].markdown);
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(join(OUTPUT_DIR, 'html.json'), JSON.stringify(html));
}

main();
