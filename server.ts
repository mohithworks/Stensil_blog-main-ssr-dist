import type { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import express from "express";
import compression from "compression";
import serveStatic from "serve-static";
import { createServer as createViteServer } from "vite";
const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

const resolve = (p: string) => path.resolve(__dirname, p);

const getStyleSheets = async () => {
  try {
    const assetpath = resolve("dist/assets");
    const files = await fs.readdir(assetpath);
    const cssAssets = files.filter(l => l.endsWith(".css"));
    const allContent = [];
    for (const asset of cssAssets) {
      const content = await fs.readFile(path.join(assetpath, asset), "utf-8");
      allContent.push(`<style type="text/css">${content}</style>`);
    }
    return allContent.join("\n");
  } catch {
    return "";
  }
};

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

async function createServer(isProd = process.env.NODE_ENV === "production") {
  const app = express();
  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: isTest ? "error" : "info",
  });

  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares);
  const requestHandler = express.static(resolve("assets"));
  app.use(requestHandler);
  app.use("/assets", requestHandler);

  if (isProd) {
    app.use(compression());
    app.use(
      serveStatic(resolve("client"), {
        index: false,
      }),
    );
  }
  const stylesheets = getStyleSheets();
  app.set('subdomain offset', 1);

  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    const subdomain = req.subdomains;

    try {
      // 1. Read index.html
      let template = await fs.readFile(isProd ? resolve("client/index.html") : resolve("index.html"), "utf-8");

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      let productionBuildPath = path.join(__dirname, "./server/entry-server.mjs");
      let devBuildPath = path.join(__dirname, "./client/entry-server.tsx");
      const { render } = await vite.ssrLoadModule(isProd ? productionBuildPath : devBuildPath);

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const { appHtml, actualData } = await render(url, subdomain[0]);
      const cssAssets = isProd ? "" : await stylesheets;

      const { error, content } = actualData;
      console.log("error", error);
      console.log("authors", content);
      var html;

      // 5. Inject the app-rendered HTML into the template.
      if(error !== null || content[0].length === 0) {
        html = template.replace(`<!--head-->`, cssAssets)
      }else {
        const title = actualData.url === 'authors' ? toTitleCase(content[0].username.toString()) : content[0].title;
        const description = content[0].description;
        const keywords = content[0].username + ', ' + content[0].username + ' blog, ' + content[0].username + ' blog posts' + ', ' + content[0].title + ' blog articles' + ', ' + content[0].title;
        const favicon = content[0].faviconimg;
        
        html = template.replace(`<!--app-html-->`, appHtml).replace(`<!--head-->`, cssAssets).replace(`<!--head-->`, cssAssets).replace(`Inkflow`, title).replace('/static/favicon-16x16.png', favicon).replace('description', description).replace('keywords', keywords);
      }
      // 6. Send the rendered HTML back.
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  const port = process.env.PORT || 2432;
  app.listen(Number(port), "0.0.0.0", () => {
    console.log(`App is listening on http://localhost:${port}`);
  });
}

createServer();
