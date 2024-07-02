import { Crawler } from '../types/common';

export class WordsLinksCrawler extends Crawler<string[]> {
  public async crawl(url: string): Promise<string[]> {
    if (!Crawler.browser) {
      throw new Error('Browser is not launched');
    }

    console.log('Start crawling word links from ', url);
    const page = await Crawler.browser.newPage();
    await page.goto(url, {
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
    console.log('Finish crawling word links from ', url);
    await page.close();

    return result;
  }
}
