import fs from 'fs';
import { ALPHABET, API_URL } from './constant';
import { HightLevelLinksCrawler } from './crawlers/high-level-links.crawler';
import { WordsLinksCrawler } from './crawlers/word-links.crawler';
import { WordCrawler } from './crawlers/word.crawler';
import { Crawler } from './types/common';

export class Runner {
  async crawlHighLevelLinks() {
    await Crawler.launch();
    const cambCrawler = new HightLevelLinksCrawler();
    const wordLinks = [];
    for (let i = 0; i < ALPHABET.length; i++) {
      const character = ALPHABET[i];
      wordLinks.push(await cambCrawler.crawl(character));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    fs.writeFileSync(
      `./word_link_lv1.json`,
      JSON.stringify(wordLinks, null, 2)
    );
    await Crawler.close();
  }

  async crawlWordLinks(wordLinkLv1: string[][], start = 0, startLinkIndex = 0) {
    const cambCrawler = new WordsLinksCrawler();
    await Crawler.launch();
    for (let i = start; i < ALPHABET.length; i++) {
      console.log(`Start crawling links ${ALPHABET[i]} from index ${i}`);
      for (let j = 0; j < wordLinkLv1[i].length; j++) {
        console.log(
          `Start crawling links from index ${j} ${wordLinkLv1[i][j]}`
        );

        if (i === start && j < startLinkIndex) {
          continue;
        }

        try {
          const links = await cambCrawler.crawl(wordLinkLv1[i][j]);
          const wordLinks = fs.readFileSync('./word_links.json', 'utf-8');
          const wordLinksJson = JSON.parse(wordLinks);
          if (!wordLinksJson[i]) {
            wordLinksJson[i] = links;
          } else {
            wordLinksJson[i] = [...wordLinksJson[i], ...links];
          }
          fs.writeFileSync(
            `./word_links.json`,
            JSON.stringify(wordLinksJson, null, 2)
          );
        } catch (error) {
          console.log(
            'Failed to crawl link from ',
            ALPHABET[i],
            ' link index',
            j,
            ' link: ',
            wordLinkLv1[i][j]
          );

          fs.writeFileSync(
            `./crawl-lock.json`,
            JSON.stringify(
              {
                start_char: i,
                link_index: j,
              },
              null,
              2
            )
          );
          await Crawler.close();
          throw error;
        }
        console.log(
          `Finish crawling links from index ${j} ${wordLinkLv1[i][j]}`
        );
      }
      console.log(`Finish crawling links ${ALPHABET[i]} from index ${i}`);
    }
    await Crawler.close();
  }

  async crawlWord(
    currentData: Record<string, unknown>,
    character: string,
    url: string
  ) {
    await Crawler.launch();
    const cambCrawler = new WordCrawler();
    const word = await cambCrawler.crawl(url);
    const path = url.replace(`${API_URL}/`, '');
    currentData[path] = {
      ...word,
      character,
    };
    fs.writeFileSync(
      `./data/${character}.json`,
      JSON.stringify(currentData, null, 2)
    );
  }

  async crawlWords(index: number) {
    const wordLinks = JSON.parse(
      fs.readFileSync('./word_links.json', 'utf-8')
    ) as string[][];
    if (!wordLinks) {
      throw new Error('Word links is not found');
    }

    const wordLinkAtIndex = wordLinks[index];
    if (!wordLinkAtIndex) {
      throw new Error('Word links at index is not found');
    }

    console.log('START CRAWLING WORDS START WITH ', ALPHABET[index]);
    console.log('Total words: ', wordLinkAtIndex.length);
    console.log('==================================================');

    let startTryAt = 0;
    try {
      startTryAt = JSON.parse(
        fs.readFileSync(`./crawl-log/${ALPHABET[index]}.json`, 'utf-8')
      ).try_again_at;
    } catch {
      console.log("Can't find try again at");
    }

    let currentData = {};
    try {
      currentData = JSON.parse(
        fs.readFileSync(`./data/${ALPHABET[index]}.json`, 'utf-8')
      );
    } catch {
      console.log("Can't find current data");
    }

    for (let i = startTryAt; i < wordLinkAtIndex.length; i++) {
      try {
        await this.crawlWord(currentData, ALPHABET[index], wordLinkAtIndex[i]);
      } catch (error) {
        console.log('Failed to crawl word at index ', index, ' link index ', i);
        fs.writeFileSync(
          `./crawl-log/${ALPHABET[index]}.json`,
          JSON.stringify({ try_again_at: i }, null, 2)
        );
        throw error;
      }
    }

    console.log('==================================================');
    console.log('FINISH CRAWLING WORDS START WITH ', ALPHABET[index]);
  }
}

// const runner = new Runner();
// runner.crawlWords(0);
// runner.crawlWord(
//   'a',
//   'https://dictionary.cambridge.org/dictionary/english/heavy-cross-to-bear'
// );
