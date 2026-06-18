#!/usr/bin/env node
import fs from 'node:fs';
import { extractReadmeSteps } from './lib/core.mjs';

const file = process.argv[2] || 'README.md';
process.stdout.write(`${JSON.stringify(extractReadmeSteps(fs.readFileSync(file, 'utf8')), null, 2)}\n`);
