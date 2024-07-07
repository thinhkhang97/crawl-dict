import { Runner } from './runner';
import { parseArgs } from './utils';

async function main(args: string[]) {
  const params = parseArgs(args) as { index: string };
  const runner = new Runner();
  const retries = 3;

  let _error: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      await runner.crawlWords(parseInt(params.index, 10));
      break;
    } catch (error) {
      console.log('RETRYING', i + 1);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      _error = error;
    }
  }

  if (_error) {
    throw _error;
  }
}

main(process.argv.slice(1));
