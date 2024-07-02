import puppeteer, { Browser } from 'puppeteer';

export abstract class Crawler<D> {
  protected static browser: Browser | null = null;

  public static async launch() {
    if (!Crawler.browser) {
      console.log('Launching browser');
      Crawler.browser = await puppeteer.launch();
    }
  }

  public static async close() {
    console.log('Closing browser');
    if (Crawler.browser) {
      await Crawler.browser.close();
    }
  }

  public abstract crawl(url: string): Promise<D>;
}
