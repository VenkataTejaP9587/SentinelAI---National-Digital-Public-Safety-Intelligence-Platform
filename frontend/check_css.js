const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto('http://localhost:3000/dashboard/admin', { waitUntil: 'networkidle0' });

  const result = await page.evaluate(() => {
    const el = document.querySelector('.max-w-6xl');
    const parent = el ? el.parentElement : null;
    const body = document.body;
    const html = document.documentElement;

    return {
      el: el ? {
        className: el.className,
        clientWidth: el.clientWidth,
        width: window.getComputedStyle(el).width,
        marginLeft: window.getComputedStyle(el).marginLeft,
        marginRight: window.getComputedStyle(el).marginRight,
        display: window.getComputedStyle(el).display,
        maxWidth: window.getComputedStyle(el).maxWidth,
      } : null,
      parent: parent ? {
        className: parent.className,
        clientWidth: parent.clientWidth,
        width: window.getComputedStyle(parent).width,
        display: window.getComputedStyle(parent).display,
        alignItems: window.getComputedStyle(parent).alignItems,
        justifyContent: window.getComputedStyle(parent).justifyContent,
      } : null,
      body: {
        clientWidth: body.clientWidth,
        width: window.getComputedStyle(body).width,
      },
      html: {
        clientWidth: html.clientWidth,
        width: window.getComputedStyle(html).width,
      }
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
