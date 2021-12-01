//pupeteer
const puppeteer = require("puppeteer");
const express = require("express");

const app = express();

app.get("/", async (req, res) => {
  try {
    const { url } = req.query;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url);

    //get the html
    const html = await page.content();

    console.log(html);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
