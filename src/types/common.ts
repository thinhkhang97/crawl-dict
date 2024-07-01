import { Word } from './word';

export interface ICrawler {
  crawl(word: string): Promise<Word>;
}
