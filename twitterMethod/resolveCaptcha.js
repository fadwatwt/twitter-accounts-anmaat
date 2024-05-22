const puppeteer = require('puppeteer');
const axios = require('axios');
const setCookie = require('set-cookie-parser');
const Captcha = require('../model/captchaModel');
const captchaModel = require('../model/captchaModel');

exports.resolveCaptcha = async (account, type) => {
  let browser;
  let username;
  let password;
  const pathToExtension = './pro_1.1.18';
  if (account.Proxy !== '') {
    const proxy = account.Proxy.split(':');
    const ip = proxy[0];
    const port = proxy[1];
    username = proxy[2];
    password = proxy[3];
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--proxy-server=' + ip + ':' + port,
        '--proxy-auth=' + username + ':' + password,
        `--load-extension=${pathToExtension}`,
        `--disable-extensions-except=${pathToExtension}`,
      ],
    });
  } else {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
  }
  const page = await browser.newPage();
  if (account.proxy !== '') {
    await page.authenticate({ username: username, password: password });
  }
  await page.setUserAgent(account.userAgent);
  let splittedPairs = account.cookie.split(';');

  let cookies = setCookie.parse(splittedPairs);
  cookies = cookies.map(async (cook) => {
    const ob = { name: cook.name.trim(), value: cook.value.trim() };
    ob.domain = '.twitter.com';
    await page.setCookie(ob);

    return ob;
  });
  console.log(cookies);

  await page.goto('https://twitter.com/account/access?lang=en', {
    waitUntil: 'networkidle2',
  });
  //await new Promise((resolve) => setTimeout(resolve, 6000));
  try {
    const start = await page.waitForSelector(
      'body > div.PageContainer > div > form > input.Button.EdgeButton.EdgeButton--primary'
    );
    start.click();
  } catch (e) {}
  console.log('here');
  await new Promise((resolve) => setTimeout(resolve, 6000));
  let frame;
  let elementHandle2;
  let frame2;
  try {
    console.log('here1');

    const elementHandle1 = await page.waitForSelector('#arkose_iframe');
    const frame1 = await elementHandle1.contentFrame();
    //console.log(await frame1.content())
    const elementHandle = await frame1.waitForSelector(
      '#arkose > div > iframe'
    );
    console.log('here2');

    frame = await elementHandle.contentFrame();
    // console.log(await frame.content())
    console.log('here22');

    elementHandle2 = await frame.waitForSelector('#game-core-frame');
    frame2 = await elementHandle2.contentFrame();
    //console.log(await frame2.content())
    console.log('here23');

    const button = await frame2.$("button[data-theme='home.verifyButton']");
    console.log('here24');

    await button.click();
    console.log('here3');

    await new Promise((resolve) => setTimeout(resolve, 8000));
  } catch (e) {
    console.log(e.message);
    if (page.url().includes('https://twitter.com/home')) {
      await browser.close();
      // console.log("here already");

      return { error: false, status: 'ok' };
    }
    await browser.close();

    return { error: true, status: 'faild' };
  }

  elementHandle2 = await frame.waitForSelector('#game-core-frame');

  frame2 = await elementHandle2.contentFrame();
  console.log('here4');

  if (type == 0) {
    const cap = await captchaModel.findOne({ captchaType: 0 }, 'captchaKey');

    if (!cap || cap.captchaKey == '') {
      return { error: true, message: 'لايوجد مفتاح لكود التحقق' };
    }
    const res = await _2Captcha(cap.captchaKey);
    if (res.error) {
      await browser.close();
      return res;
    }
    await page.evaluate((_) => {
      var myjs = res.request;
      document.getElementById('FunCaptcha-Token').value = myjs;
      document.getElementById('verification-token').value = myjs;
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.evaluate((_) => {
      parent.postMessage(
        JSON.stringify({
          eventId: 'challenge-complete',
          payload: { sessionToken: res.request },
        }),
        '*'
      );
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();

    return { error: false, status: 'ok' };
  } else {
    const cap = await captchaModel.findOne({ captchaType: 1 }, 'captchaKey');
    console.log('cap.captchaKey');
    console.log(cap.captchaKey);
    console.log('cap.captchaKey');
    if (!cap || cap.captchaKey == '') {
      return { error: true, message: 'لايوجد مفتاح لكود التحقق' };
    }
    //const question = await frame2.$eval("h2", (el) => el.innerText);
    // console.log(question);
    // const buttonc = await frame2.$eval(
    //   "button",
    //   (el) => el.style.backgroundImage
    // );
    //const url = buttonc.slice(5, -2);
    // Create a new page
    //const page2 = await browser.newPage();

    // Set viewport width and height

    // Open URL in current page
    // await page2.goto(url, { waitUntil: "networkidle0" });
    // await page2.evaluate(
    //   () => (document.body.style.background = "transparent")
    // );
    // const image = await page2.screenshot({
    //encoding: "base64",
    //omitBackground: true,
    //clip: { x: 250, y: 200, width: 300, height: 200 },
    // });
    // await page2.screenshot({
    //   path: "screenshot.jpg",
    //   omitBackground: true,
    //   clip:{x:250,y:200,width:300 ,height :200}

    // });
    //   await new Promise((resolve) => setTimeout(resolve, 1000));

    //  await page.bringToFront();
    // const request = {
    //  clientKey: cap.captchaKey,
    //task: {
    //  type: "FunCaptchaClassification",
    // question: question,
    // image: "data:image/jpeg;base64," + image,
    //},
    //};
    // const uRL = "https://api.yescaptcha.com/createTask";
    //  const response = await axios.post(uRL, request);
    //console.log(request);
    //console.log(JSON.stringify(response.data));

    // const buttons = await frame2.$$(
    //   "#root > div > div.sc-99cwso-0.sc-11w6f91-0.gMEQEa.eWRcSj.tile-game.box.screen > div > div.sc-99cwso-0.sc-kms482-2.gMEQEa.gkfJHB.box.challenge-container > div > button"
    // );
    // if (response.data?.solution?.objects) {
    /// const index = response.data?.solution?.objects[0];
    // buttons[index].click();
    // await new Promise((resolve) => setTimeout(resolve, 6000));
    try {
      elementHandle2 = await frame.waitForSelector('#game-core-frame');
      frame2 = await elementHandle2.contentFrame();
    } catch {
      await browser.close();
      console.log('here5');

      return { error: false, status: 'ok' };
    }
    try {
      const fail = await frame2.$(
        '#root > div > div.sc-99cwso-0.sc-11w6f91-0.gMEQEa.eWRcSj.tile-game-fail.box.screen > button'
      );
      fail.click();
      await browser.close();
      console.log('here7');

      return { error: true, message: 'فشل في حل كود التحقق' };
    } catch (e) {
      await browser.close();

      return { error: false, status: 'ok' };
    }
    // } else {
    //await browser.close();
    // console.log("here8");

    //  return { error: true, message: response.data?.errorCode };
    // }
    // await browser.close();
  }
};
async function _2Captcha(key) {
  const url = 'https://twitter.com/account/access';
  const publicKey = '0152B4EB-D2DC-460A-89A1-629838B529C9';
  const surl = 'https://client-api.arkoselabs.com/';
  try {
    const response = await axios.get('https://2captcha.com/in.php', {
      params: {
        key: key,
        method: 'funcaptcha',
        publickey: publicKey,
        surl: surl,
        pageurl: url,
        json: 1,
      },
    });
    console.log(response.data);
    if (response.data.status == 0) {
      return { error: true, message: response.data.error_text };
    }
    if (response.data?.status == 1) {
      const request = response.data?.request;
      for (let index = 0; index < 1; ++index) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const res = await axios.get('https://2captcha.com/res.php', {
          params: {
            key: key,
            action: 'get',
            id: request,
            json: 1,
          },
        });
        if (res.data.status == 0) {
          return { error: true, message: response.data.error_text };
        }
        if (res.data.status == 1) {
          return { error: false, request: response.data.request };
        }
        if (res.data.request != 'CAPCHA_NOT_READY') {
          return { error: true, message: response.data.request };
        }
      }
      return { error: true, message: 'Timeout' };
    }
  } catch {}
  return { error: true, message: 'Unknown error' };
}
