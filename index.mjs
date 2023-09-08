import { chromium } from "playwright";
import path from "path";


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

const context = await chromium.launchPersistentContext(userDataDir, options);


