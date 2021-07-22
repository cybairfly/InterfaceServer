/* eslint-disable no-console */
const Apify = require('apify');
const fs = require('fs-extra');
const InterfaceServer = require('../src/index');

const PROMPT_HANDLERS = {
    cancel: () => {
        console.log('Cancel event handler called!');
    },
};

const TIMEOUT = 60 * 1000;

const { utils: { log, sleep } } = Apify;

describe('Server running', () => {
    test('Interface server with HTML source and prompt handler', async () => {
        const { browser, guiTestPage, guiTestBrowser, interfaceServer } = await start({ useScreenshots: false });
        try {
            const page = await browser.newPage();
            await Promise.all([
                page.goto('https://apify.com'),
                guiTestPage.goto('http://localhost:4321/'),
            ]);
            await interfaceServer.serve(page);
            await testGuiPageUrl(guiTestPage, 'https://apify.com/');
            await sleep(1 * 1000);
            const logs = [];
            const storeLog = (inputs) => logs.push(inputs);
            // mocking console.log to test the handler output
            const originalLog = console.log;
            console.log = jest.fn(storeLog);
            await Promise.all([
                guiTestPage.waitForSelector('#cancel', { visible: true })
                    // sleeps are here just so what's happening is visible, should work with this sleep removed too
                    .then(() => sleep(1000))
                    .then(() => guiTestPage.hover('#cancel', (el) => el.click()))
                    .then(() => sleep(1000))
                    .then(() => guiTestPage.$eval('#cancel', (el) => el.click())),
                interfaceServer.prompt({
                    title: 'Confirm payment',
                    message: 'This is an example payment confirmation modal.',
                }),
            ]);
            console.log = originalLog;
            expect(logs).toEqual(expect.arrayContaining(['Cancel event handler called!']));
            await sleep(10 * 1000);
        } catch (err) {
            await cleanup({ browser, guiTestBrowser, interfaceServer }).catch((cleanupErr) => log.error(cleanupErr));
            throw err;
        }
        log.info('Starting cleanup');
        await cleanup({ browser, guiTestBrowser, interfaceServer });
    }, TIMEOUT);

    test('Interface server with screenshot', async () => {
        const { browser, guiTestPage, guiTestBrowser, interfaceServer } = await start({ useScreenshots: true });
        try {
            const page = await browser.newPage();
            await Promise.all([
                page.goto('https://apify.com'),
                guiTestPage.goto('http://localhost:4321/'),
            ]);
            await interfaceServer.serve(page);
            await testGuiPageUrl(guiTestPage, 'https://apify.com/');
            await sleep(3 * 1000);
        } catch (err) {
            await cleanup({ browser, guiTestBrowser, interfaceServer }).catch((cleanupErr) => log.error(cleanupErr));
            throw err;
        }
        log.info('Starting cleanup');
        await cleanup({ browser, guiTestBrowser, interfaceServer });
    }, TIMEOUT);

    const start = async ({ useScreenshots }) => {
        const interfaceServer = new InterfaceServer({
            promptHandlers: PROMPT_HANDLERS,
            useScreenshots,
        });
        interfaceServer.log.setLevel(log.LEVELS.DEBUG);
        await interfaceServer.start();

        /** @type {import('puppeteer').Browser} */
        const browser = await Apify.launchPuppeteer({ launchOptions: { headless: true } });
        const guiTestBrowser = await Apify.launchPuppeteer({ launchOptions: { headless: false } });
        /** @type {[import('puppeteer').Page]} */
        const [guiTestPage] = await guiTestBrowser.pages();
        return { browser, guiTestPage, guiTestBrowser, interfaceServer };
    };

    const cleanup = async ({ browser, guiTestBrowser, interfaceServer }) => {
        return Promise.all([
            interfaceServer.stop(),
            browser.close(),
            guiTestBrowser.close(),
            fs.rm(interfaceServer.screenshotDirectoryPath, { recursive: true, force: true }),
        ]);
    };
    /**
     * waits until a page is loaded, and checks if the URL on frontend matches the goto
     * @param {import('puppeteer').Page} page
     */
    const testGuiPageUrl = async (page, url) => {
        await page.waitForFunction(
            () => document.getElementById('pageUrl').textContent.trim() !== 'Loading...',
            { timeout: 10 * 1000 },
        );
        const guiPageUrl = await page.$eval('div#pageUrl', (el) => el.textContent.trim());
        expect(guiPageUrl).toBe(url);
    };
});
