//pupeteer
const puppeteer = require("puppeteer");
const express = require("express");
const htmlMd = require("node-html-markdown");
const createError = require("http-errors");

const app = express();

// For reuse nhm
const nhm = new htmlMd.NodeHtmlMarkdown();

//set pug as view engine
app.set("view engine", "pug");
app.set("views", "./views");

app.get("/", async (req, res) => {
  res.render("index.pug", {
    title: "Get phim data",
  });
});

app.get("/get-data", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      throw new Error("url is required");
    }

    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === "production",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url);

    // Regexp
    const phimgi = new RegExp(/^https:\/\/phimgii.net\//i);
    const phimmoi = new RegExp(/^https:\/\/ephimmoi.net\//i);

    // data to return
    let data = {};

    if (url.match(phimgi)) {
      console.log("[dbg] match phimgii");

      //get .entry-title
      const entryTitle = await page.evaluate(() => {
        const title = document.querySelector(".entry-title");

        return title?.innerText;
      });

      // get .item-content.toggled
      const description = await page.evaluate(() => {
        // replace \n with enter
        const description = document.querySelector(".item-content");
        return description?.innerText;
      });

      // get .title-year > a
      const year = await page.evaluate(() => {
        const year = document.querySelector(".title-year > a");
        return year?.innerText;
      });

      // get .actors > a
      const country = await page.evaluate(() => {
        const actors = document.querySelector(".actors > a");
        return actors?.innerText;
      });

      // get .movie-thumb
      const poster = await page.evaluate(() => {
        const poster = document.querySelector(".movie-thumb");
        return poster?.src;
      });

      const [title, englishTitle] = entryTitle.split(" – ");

      //set to data
      data = {
        title,
        englishTitle,
        description,
        year,
        country,
        image: poster,
      };
    } else if (url.match(phimmoi)) {
      // get .movie-title > .title-1
      const title = await page.evaluate(() => {
        const title = document.querySelector(".movie-title > .title-1");
        return title?.innerText;
      });

      // get .movie-title > .title-2
      const englishTitle = await page.evaluate(() => {
        const title = document.querySelector(".movie-title > .title-2");
        return title?.innerText;
      });

      // get .title-year
      const year = await page.evaluate(() => {
        // remove the ()
        const year = document.querySelector(".title-year");
        return year?.innerText.replace(/\(|\)/g, "");
      });

      // get all .movie-dd
      const time = await page.evaluate(() => {
        const elms = document.querySelectorAll(".movie-dd");

        console.log("time", elms);

        // get elms that match "phút"
        const time = Array.from(elms).filter((elm) =>
          elm.innerText.match(/phút/i)
        );

        return time?.[0]?.innerText;
      });

      // get all .movie-dd .dd-cat
      const country = await page.evaluate(() => {
        const elms = document.querySelectorAll(".movie-dd.dd-cat");

        console.log("country", elms);

        // get elms that the href match "country"
        const country = Array.from(elms).filter((elm) =>
          elm.href?.match(/country/i)
        );

        return country?.[0]?.innerText;
      });

      // get .movie-l-img > img
      const poster = await page.evaluate(() => {
        const poster = document.querySelector(".movie-l-img > img");
        return poster?.src;
      });

      await page.exposeFunction("nhm", (html) => nhm.translate(html));

      //get .film-content
      const description = await page.evaluate(async () => {
        const description = document.querySelector("#film-content");

        return await nhm(description?.innerHTML);
      });

      //set to data
      data = {
        title,
        englishTitle,
        description,
        year,
        time,
        country,
        image: poster,
      };
    }

    //get the html
    const html = await page.content();

    await browser.close();

    res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    res.json({ success: false, error: error.message });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handle
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  //send json
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
    error: err,
  });
});

app.listen(process.env.PORT || 3001, () => {
  console.log("Server started on port 3001");
});
