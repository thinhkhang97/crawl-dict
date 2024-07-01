import { ICrawler } from './types/common';
import puppeteer from 'puppeteer';
import { Word } from './types/word';
import fs from 'fs';

const API_URL = `https://dictionary.cambridge.org/dictionary/english`;

class CambCrawler implements ICrawler {
  async crawl(word: string): Promise<Word> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
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
}

const cambCrawler = new CambCrawler();
const crawlWord = 'light';
const word = cambCrawler.crawl(crawlWord);
word.then((w) => {
  fs.writeFileSync(`./${crawlWord}.json`, JSON.stringify(w, null, 2));
});
