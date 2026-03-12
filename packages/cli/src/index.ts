#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('synapse')
  .description('CLI tooling for the SynapseJS framework')
  .version('0.1.0');

program.addCommand(initCommand);

program.parse();
