import puppeteer, { Browser } from 'puppeteer';
import { Word } from './types/word';
import fs from 'fs';

const API_URL = `https://dictionary.cambridge.org/dictionary/english`;
const BROWSE_API_URL = `https://dictionary.cambridge.org/browse/english`;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

class CambCrawler {
  private static browser: Browser | null = null;

  public static async launch() {
    if (!CambCrawler.browser) {
      CambCrawler.browser = await puppeteer.launch();
    }
  }

  public static async close() {
    if (CambCrawler.browser) {
      await CambCrawler.browser.close();
    }
  }

  async crawl(word: string): Promise<Word> {
    if (!CambCrawler.browser) {
      throw new Error('Browser is not launched');
    }

    const page = await CambCrawler.browser.newPage();
    await page.goto(`${API_URL}/${word}`, {
      waitUntil: ['networkidle2'],
    });

    const result = await page.evaluate(() => {
      const meaningSections = document.querySelectorAll('.pr .entry-body__el');
      const meanings = [];
      meaningSections.forEach((meaningSection) => {
        const word_type = (
          meaningSection.querySelector(
            'div.pos-header.dpos-h > div.posgram.dpos-g.hdib.lmr-5 > span'
          ) as HTMLElement
        )?.innerText;

        const ipaSections = meaningSection.querySelectorAll('.dpron-i');
        const ipa = [];

        ipaSections.forEach((ipaSection) => {
          const region = ipaSection.querySelector('.region.dreg')?.textContent;
          const pronunciation =
            ipaSection.querySelector('.pron.dpron > span')?.textContent;
          ipa.push({ region, pronunciation });
        });

        const subMeaningSections = meaningSection.querySelectorAll(
          'div.sense-body.dsense_b > div.def-block.ddef_block'
        );

        subMeaningSections.forEach((subMeaningSection) => {
          let level = subMeaningSection.querySelector(
            'span.def-info.ddef-info > span'
          )?.textContent;

          if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
            level = 'N/A';
          }

          const definition =
            subMeaningSection.querySelector('.def.ddef_d.db')?.textContent;

          const examples = [];
          subMeaningSection
            .querySelectorAll('.examp.dexamp > span.eg.deg')
            .forEach((e) => {
              examples.push(e.textContent);
            });
          meanings.push({
            word_type,
            ipa,
            definition,
            level,
            examples,
          });
        });
      });

      return meanings;
    });
    return {
      name: word,
      meanings: result,
    };
  }

  async crawlWordLinks(character: string): Promise<string[]> {
    if (!CambCrawler.browser) {
      throw new Error('Browser is not launched');
    }

    const page = await CambCrawler.browser.newPage();
    await page.goto(`${BROWSE_API_URL}/${character}`, {
      waitUntil: ['networkidle2'],
    });
    const result = await page.evaluate(() => {
      const wordList = [];
      const wordListElements = document.querySelectorAll(
        'body > div.cc.fon > div > div > div.hfr-m.ltab.lp-m_l-15 > div.x.lmt-15 > div.hfl-s.lt2b.lmt-10.lmb-25.lp-s_r-20 > div.hdf.ff-50.lmt-15.i-browse a'
      ) as NodeListOf<HTMLAnchorElement>;
      wordListElements.forEach((wordListElement) => {
        wordList.push(wordListElement.href);
      });
      return wordList;
    });
    return result;
  }
}

// const cambCrawler = new CambCrawler();
// const crawlWord = 'light';
// const word = cambCrawler.crawl(crawlWord);
// word.then((w) => {
//   fs.writeFileSync(`./${crawlWord}.json`, JSON.stringify(w, null, 2));
// });

async function crawlWordLinks() {
  await CambCrawler.launch();
  const cambCrawler = new CambCrawler();
  const wordLinks = [];
  for (let i = 0; i < ALPHABET.length; i++) {
    const character = ALPHABET[i];
    wordLinks.push(await cambCrawler.crawlWordLinks(character));
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  fs.writeFileSync(`./word_list.json`, JSON.stringify(wordLinks, null, 2));
  await CambCrawler.close();
}

crawlWordLinks();
