#!/usr/bin/env node
import path from 'node:path';
import { createCleanroom } from './lib/core.mjs';

const repo = path.resolve(process.argv[2] || '.');
process.stdout.write(`${JSON.stringify(createCleanroom(repo), null, 2)}\n`);
