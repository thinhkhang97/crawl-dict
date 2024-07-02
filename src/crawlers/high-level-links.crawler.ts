import { BROWSE_API_URL } from '../constant';
import { Crawler } from '../types/common';

export class HightLevelLinksCrawler extends Crawler<string[]> {
  public async crawl(character: string): Promise<string[]> {
    if (!Crawler.browser) {
      throw new Error('Browser is not launched');
    }

    const page = await Crawler.browser.newPage();
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
