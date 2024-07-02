import { Runner } from './runner';
import { parseArgs } from './utils';

function main(args: string[]): void {
  const params = parseArgs(args) as { index: string };
  const runner = new Runner();
  runner.crawlWords(parseInt(params.index, 10));
}

main(process.argv.slice(1));
