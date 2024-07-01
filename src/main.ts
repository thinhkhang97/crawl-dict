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

  async crawlLinksLevel1(character: string): Promise<string[]> {
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

  async crawlWordLinks(linkLevel1: string): Promise<string[]> {
    if (!CambCrawler.browser) {
      throw new Error('Browser is not launched');
    }

    console.log('Start crawling word links from ', linkLevel1);
    const page = await CambCrawler.browser.newPage();
    await page.goto(linkLevel1, {
      waitUntil: ['networkidle2'],
    });
    const result = await page.evaluate(() => {
      const wordLinks = [];
      const wordLinksElements = document.querySelectorAll(
        'body > div.cc.fon > div > div > div.hfr-m.ltab.lp-m_l-15 > div.x.lmt-15 > div.hfl-s.lt2b.lmt-10.lmb-25.lp-s_r-20 > div.hdf.ff-50.lmt-15.i-browse a'
      ) as NodeListOf<HTMLAnchorElement>;
      wordLinksElements.forEach((wordLinksElement) => {
        wordLinks.push(wordLinksElement.href);
      });
      return wordLinks;
    });
    console.log('Finish crawling word links from ', linkLevel1);
    return result;
  }
}

// const cambCrawler = new CambCrawler();
// const crawlWord = 'light';
// const word = cambCrawler.crawl(crawlWord);
// word.then((w) => {
//   fs.writeFileSync(`./${crawlWord}.json`, JSON.stringify(w, null, 2));
// });

async function crawlLinksLevel1() {
  await CambCrawler.launch();
  const cambCrawler = new CambCrawler();
  const wordLinks = [];
  for (let i = 0; i < ALPHABET.length; i++) {
    const character = ALPHABET[i];
    wordLinks.push(await cambCrawler.crawlLinksLevel1(character));
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  fs.writeFileSync(`./word_link_lv1.json`, JSON.stringify(wordLinks, null, 2));
  await CambCrawler.close();
}

// crawlLinksLevel1();

async function crawlWordLinks(
  wordLinkLv1: string[][],
  start = 0,
  startLinkIndex = 0
) {
  await CambCrawler.launch();
  const cambCrawler = new CambCrawler();
  for (let i = start; i < ALPHABET.length; i++) {
    console.log(`Start crawling links from index ${i} ${ALPHABET[i]}`);
    for (let j = 0; j < wordLinkLv1[i].length; j++) {
      updateProgressBar(
        j,
        wordLinkLv1[i].length,
        `Start crawling links from index ${j} ${wordLinkLv1[i][j]}`
      );
      if (i === start && j < startLinkIndex) {
        continue;
      }

      try {
        const links = await cambCrawler.crawlWordLinks(wordLinkLv1[i][j]);
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
        await CambCrawler.close();
        throw error;
        // console.log('Restarting browser');
        // await CambCrawler.close();
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        // await CambCrawler.launch();
        // console.log('Restarted browser');
      }
      updateProgressBar(
        j,
        wordLinkLv1[i].length,
        `Start crawling links from ${wordLinkLv1[i][j]}`
      );
    }
  }
  await CambCrawler.close();
}

function updateProgressBar(currentValue, totalValue, message = '') {
  const progressBarLength = 100; // Length of the progress bar in characters
  const percentageComplete = (currentValue / totalValue) * 100;
  const completeLength = Math.floor(
    (percentageComplete / 100) * progressBarLength
  );
  const progressBar =
    '#'.repeat(completeLength) + '-'.repeat(progressBarLength - completeLength);
  process.stdout.write(
    `\r[${progressBar}] ${percentageComplete.toFixed(2)}%-${message.padEnd(
      progressBarLength
    )}`
  );
  if (currentValue === totalValue) {
    process.stdout.write('\n'); // Move to the next line when 100% complete
  }
}

async function run() {
  const wordLinkLv1 = JSON.parse(
    fs.readFileSync('./word_link_lv1.json', 'utf-8')
  );
  if (!wordLinkLv1) {
    throw new Error('Word link level 1 is not found');
  }

  const crawlLock = fs.readFileSync('./crawl-lock.json', 'utf-8');
  const { start_char, link_index } = JSON.parse(crawlLock);
  await crawlWordLinks(wordLinkLv1, start_char, link_index);
}

run();
