import { Crawler } from '../types/common';
import { Word } from '../types/word';

export class WordCrawler extends Crawler<Word> {
  public async crawl(url: string): Promise<Word> {
    if (!Crawler.browser) {
      throw new Error('Browser is not launched');
    }

    console.log(`Crawling ${url}`);
    const page = await Crawler.browser.newPage();
    await page.goto(url, {
      waitUntil: ['networkidle2'],
    });

    const result = await page.evaluate(() => {
      const crawlWordType = (meaningSections: NodeListOf<Element>) => {
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
            const region =
              ipaSection.querySelector('.region.dreg')?.textContent;
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
      };

      const crawlPhraseType = (meaningSections: NodeListOf<Element>) => {
        const meanings = [];
        meaningSections.forEach((meaningSection) => {
          const word_type = (
            meaningSection.querySelector(
              'span.di-info > span.pos.dpos'
            ) as HTMLElement
          )?.innerText;

          const subMeaningSections = meaningSection.querySelectorAll(
            'span.phrase-di-body.dphrase-di-body > div.def-block.ddef_block'
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
              ipa: [],
              definition,
              level,
              examples,
            });
          });
        });
        return meanings;
      };

      const crawlIdiomType = (meaningSections: NodeListOf<Element>) => {
        const meanings = [];
        meaningSections.forEach((meaningSection) => {
          const word_type = 'idiom';

          const subMeaningSections = meaningSection.querySelectorAll(
            '.pr.dsense.dsense-noh'
          );

          subMeaningSections.forEach((subMeaningSection) => {
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
              ipa: [],
              definition,
              level: 'N/A',
              examples,
            });
          });
        });
        return meanings;
      };

      const nameElement =
        (document.querySelector('.headword > b') as HTMLElement) ||
        (document.querySelector(
          'span.headword.hdb.tw-bw.dhw.dpos-h_hw > span.hw.dhw'
        ) as HTMLElement) ||
        (document.querySelector(
          'h2.headword.tw-bw.dhw.dpos-h_hw.dhw-m > b'
        ) as HTMLElement);
      const wordTypeMeaningSections = document.querySelectorAll(
        '.pr .entry-body__el'
      );

      if (wordTypeMeaningSections.length > 0) {
        return {
          name: nameElement?.innerText,
          meanings: crawlWordType(wordTypeMeaningSections),
        };
      }

      const phraseTypeMeaningSections = document.querySelectorAll(
        'span.phrase-di-body.dphrase-di-body'
      );

      if (phraseTypeMeaningSections.length > 0) {
        return {
          name: nameElement?.innerText,
          meanings: crawlPhraseType(phraseTypeMeaningSections),
        };
      }

      const idiomTypeMeaningSections = document.querySelectorAll(
        '.idiom-body.didiom-body'
      );

      if (idiomTypeMeaningSections.length > 0) {
        return {
          name: nameElement?.innerText,
          meanings: crawlIdiomType(idiomTypeMeaningSections),
        };
      }
    });

    await page.close();
    console.log(`Complete crawling ${url}`);
    return result;
  }
}
