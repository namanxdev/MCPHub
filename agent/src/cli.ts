import { Command } from 'commander';
import { startServer } from './server.js';

const program = new Command();

program
  .name('mcphub-agent')
  .description('Local agent for connecting MCPHub to localhost MCP servers')
  .version('1.0.0');

program
  .command('start')
  .description('Start the MCPHub Desktop Agent')
  .option('-p, --port <port>', 'Port to listen on', '54319')
  .action((options) => {
    const port = parseInt(options.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Error: Port must be a number between 1 and 65535');
      process.exit(1);
    }

    startServer({ port });
  });

export function run(): void {
  program.parse();
}
