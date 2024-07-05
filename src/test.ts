import { writeFileSync } from 'fs';
import { WordCrawler } from './crawlers/word.crawler';
import { API_URL } from './constant';

async function test() {
  const cambCrawler = new WordCrawler();
  const word = await cambCrawler.crawl(API_URL + '/barrage-of');
  writeFileSync('word.json', JSON.stringify(word, null, 2));
}

test();
