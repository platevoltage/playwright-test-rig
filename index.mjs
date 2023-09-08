import { chromium } from "playwright";
import path from "path";
// import https from "https";
import fs from "fs";
import { XMLHttpRequest } from "xmlhttprequest";

import followRedirects from "follow-redirects";
const https = followRedirects.https;

const userDataDir = path.join("./playwright-data");


const options = {
//   args,
  headless: false,
  ignoreDefaultArgs: ["--enable-automation", "--no-sandbox"],
  // userAgent: profile!.userAgent,
  //   httpCredentials: {
  //     username,
  //     password
  //   },
  viewport: null,
  ignoreHTTPSErrors: true,
  acceptDownloads: true

};

(async () => {

  const context = await chromium.launchPersistentContext(userDataDir, options);
  
  const page = await context.newPage();
  await page.goto("https://chrome.google.com/webstore/detail/crx-extractordownloader/ajkhmmldknmfjnmeedkbkkojgobmljda");
  
  await page.waitForSelector("[aria-label=\"Add to Chrome\"]");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // await page.evaluate(() => document.querySelector("[aria-label=\"Add to Chrome\"]").click());
  
  const button = await page.locator("[aria-label=\"Add to Chrome\"]").first();
  console.log(button);
  // const url = new Array(2);
  let url =  await page.url();
  // const urlSplit = url[0].split("/");
  // url[1] = urlSplit[urlSplit.length - 1];
  
  const title = await page.title();

  const chromeVersion = await page.evaluate(() => {
    var pieces = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
    if (pieces == null || pieces.length != 5) {
      return undefined;
    }
    pieces = pieces.map(piece => parseInt(piece, 10));
    return {
      major: pieces[1],
      minor: pieces[2],
      build: pieces[3],
      patch: pieces[4]
    };
  });

  console.log(chromeVersion);

  const naclArch = await page.evaluate(() => {
    var nacl_arch = "arm";
    if (navigator.userAgent.indexOf("x86") > 0) {
      nacl_arch = "x86-32";
    } else if (navigator.userAgent.indexOf("x64") > 0) {
      nacl_arch = "x86-64";
    }
    return nacl_arch;
  });

  console.log(naclArch);
  let version = chromeVersion.major + "." + chromeVersion.minor + "." + chromeVersion.build + "." + chromeVersion.patch;

  let chromeURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[/#?]|$)/;
  let microsoftURLPattern = /^https?:\/\/microsoftedge.microsoft.com\/addons\/detail\/.+?\/([a-z]{32})(?=[/#?]|$)/;

  function getTabTitle(title, currentEXTId) {
    title = title.match(/^(.*[-])/);
    if (title) {
      title = title[0].split(" - ").join("");
    } else {
      title = currentEXTId;
    }
    // Ѐ-ӿ matches cyrillic characters
    return (title).replace(/[&/\\#,+()$~%.'":*?<>|{}\sЀ-ӿ]/g, "-").replace(/-*$/g, "").replace(/-+/g, "-");
  }

  function download(downloadAs) {
    console.log("result");
    var query = {
      active: true,
      currentWindow: true
    };
    const result = chromeURLPattern.exec(url);
    if (downloadAs === "zip") {
      url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&x=id%3D${result[1]}%26installsource%3Dondemand%26uc&nacl_arch=${naclArch}&acceptformat=crx2,crx3`;
      return url;
      
    } else if (downloadAs === "crx") {
      url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${result[1]}%26uc&nacl_arch=${naclArch}`;
      // downloadFile(url, name + ".crx", result[1] + ".crx");
      return url;
    }
    // return result;
    // return "success";
  }
  function ArrayBufferToBlob(arraybuffer, callback) {

    var data = arraybuffer;
    var buf = new Uint8Array(data);
    var publicKeyLength, signatureLength, header, zipStartOffset;
    if (buf[4] === 2) {
      header = 16;
      publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
      signatureLength = 0 + buf[12] + (buf[13] << 8) + (buf[14] << 16) + (buf[15] << 24);
      zipStartOffset = header + publicKeyLength + signatureLength;
    } else {
      publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24 >>> 0);
      zipStartOffset = 12 + publicKeyLength;
    }
    // 16 = Magic number (4), CRX format version (4), lengths (2x4)

    var zipFragment = new Blob([
      new Uint8Array(arraybuffer, zipStartOffset)
    ], {
      type: "application/zip"
    });
    callback(zipFragment);
  }


  const downloadUrl = await download("crx");
  console.log(downloadUrl);


  const file = fs.createWriteStream("extension.crx");

  const request = https.get(downloadUrl, function(response) {
    response.pipe(file);
    console.log(typeof file);
    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  });

})();