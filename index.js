//pupeteer
const puppeteer = require("puppeteer");
const express = require("express");

const app = express();

app.get("/", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("url is required");
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url);

    //get the html
    const html = await page.content();

    await browser.close();

    res.json(html);
  } catch (error) {
    console.log(error);

    res.json(error);
  }
});

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
