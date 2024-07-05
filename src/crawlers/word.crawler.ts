import { Crawler } from '../types/common';
import { Word } from '../types/word';
import cheerio, { Cheerio, CheerioAPI, Element } from 'cheerio';

export class WordCrawler extends Crawler<Word> {
  crawlWordType($: CheerioAPI, meaningSections: Cheerio<Element>) {
    const meanings = [];
    meaningSections.each(function () {
      const word_type = $(this)
        .find('div.pos-header.dpos-h > div.posgram.dpos-g.hdib.lmr-5 > span')
        ?.text();

      const ipaSections = $(this).find('.dpron-i');
      const ipa = [];

      ipaSections.each(function () {
        const region = $(this).find('.region.dreg')?.text();
        const pronunciation = $(this).find('.pron.dpron > span')?.text();
        ipa.push({ region, pronunciation });
      });

      const subMeaningSections = $(this).find(
        'div.sense-body.dsense_b > div.def-block.ddef_block'
      );

      subMeaningSections.each(function () {
        let level = $(this).find('span.def-info.ddef-info > span')?.text();

        if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
          level = 'N/A';
        }

        const definition = $(this).find('.def.ddef_d.db')?.text();

        const examples = [];
        $(this)
          .find('.examp.dexamp > span.eg.deg')
          .each(function () {
            examples.push($(this).text());
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
  }

  crawlPhraseType($: CheerioAPI, meaningSections: Cheerio<Element>) {
    const meanings = [];
    meaningSections.each(function () {
      const word_type = $(this).find('span.di-info > span.pos.dpos')?.text();

      const subMeaningSections = $(this).find(
        'span.phrase-di-body.dphrase-di-body > div.def-block.ddef_block'
      );

      subMeaningSections.each(function () {
        let level = $(this).find('span.def-info.ddef-info > span')?.text();

        if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
          level = 'N/A';
        }

        const definition = $(this).find('.def.ddef_d.db')?.text();

        const examples = [];
        $(this)
          .find('.examp.dexamp > span.eg.deg')
          .each(function () {
            examples.push($(this).text());
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
  }

  crawlIdiomType($: CheerioAPI, meaningSections: Cheerio<Element>) {
    const meanings = [];
    meaningSections.each(function () {
      const word_type = 'idiom';

      const subMeaningSections = $(this).find('.pr.dsense.dsense-noh');

      subMeaningSections.each(function () {
        const definition = $(this).find('.def.ddef_d.db')?.text();

        const examples = [];
        $(this)
          .find('.examp.dexamp > span.eg.deg')
          .each(function () {
            examples.push($(this).text());
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
  }

  public async crawl(url: string): Promise<Word> {
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);

    const name =
      $('.headword > b')?.first()?.text() ||
      $('span.headword.hdb.tw-bw.dhw.dpos-h_hw > span.hw.dhw')
        ?.first()
        ?.text() ||
      $('h2.headword.tw-bw.dhw.dpos-h_hw.dhw-m > b')?.first()?.text();
    const wordTypeMeaningSections = $('.pr .entry-body__el');

    if (wordTypeMeaningSections.length > 0) {
      return {
        name,
        meanings: this.crawlWordType($, wordTypeMeaningSections),
      };
    }

    const phraseTypeMeaningSections = $('span.phrase-di-body.dphrase-di-body');

    if (phraseTypeMeaningSections.length > 0) {
      return {
        name,
        meanings: this.crawlPhraseType($, phraseTypeMeaningSections),
      };
    }

    const idiomTypeMeaningSections = $('.idiom-body.didiom-body');

    if (idiomTypeMeaningSections.length > 0) {
      return {
        name,
        meanings: this.crawlIdiomType($, idiomTypeMeaningSections),
      };
    }
  }
}
