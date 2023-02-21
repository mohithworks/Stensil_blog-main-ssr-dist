import * as jsxRuntime from "react/jsx-runtime";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
const jsx = jsxRuntime.jsx;
const jsxs = jsxRuntime.jsxs;
const logoImg = "data:image/png;base64,";
const logoLightImg = "data:image/png;base64,";
const SubLogo = ({
  img = logoImg,
  imgLight = logoLightImg
}) => {
  return /* @__PURE__ */ jsx(Link, { to: "/", className: "ttnc-logo inline-block text-primary-6000", children: /* @__PURE__ */ jsx("img", { className: "mx-auto h-14 sm:h-12 md:h-12 text-neutral-400", alt: "svgImg", src: img }) });
};
const ServerNav = ({ logoimg, username }) => {
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "container py-5 relative flex justify-between items-center space-x-4 xl:space-x-8", children: /* @__PURE__ */ jsx("div", { className: "flex justify-start flex-grow items-center space-x-4 sm:space-x-10 2xl:space-x-14", children: logoimg == null ? /* @__PURE__ */ jsx("h2", { className: `text-1xl md:text-2xl font-semibold`, children: username.toUpperCase() }) : /* @__PURE__ */ jsx(SubLogo, { img: logoimg }) }) }) });
};
const ServerHeader = ({
  desc,
  title = "Inkflow",
  className = "mt-20 text-neutral-900 dark:text-neutral-50",
  isCenter = true
}) => {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `nc-Section-Heading relative flex flex-col sm:flex-row sm:items-end justify-between ${className}`,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: isCenter ? "text-center w-full max-w-2xl mx-auto " : "max-w-2xl",
          children: [
            /* @__PURE__ */ jsx("h2", { className: `text-3xl md:text-5xl font-semibold`, children: title }),
            desc && /* @__PURE__ */ jsx("span", { className: "mt-2 md:mt-3 font-normal block text-base sm:text-xl text-neutral-500 dark:text-neutral-400", children: desc })
          ]
        }
      )
    }
  );
};
const ServerLoading = ({ size = 30 }) => {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `flex justify-center align-center pt-5 lg:pt-10`,
      children: /* @__PURE__ */ jsx("div", { className: "flex justify-center align-center", children: /* @__PURE__ */ jsx(CircularProgress, { size }) })
    }
  );
};
const AppSever = ({ data = "" }) => {
  const { content } = data;
  return /* @__PURE__ */ jsxs("div", { className: "justify-center align-center bg-white text-base h-full w-full dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200", children: [
    /* @__PURE__ */ jsx(ServerNav, { logoimg: content[0].logoimg, username: content[0].username }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(ServerHeader, { desc: data.url === "authors" ? content[0].description : null, title: content[0].title }) }),
    /* @__PURE__ */ jsx(ServerLoading, {})
  ] });
};
const SUPABASE_URL = "https://vwporhpsnujzncbdxtaj.supabase.co";
const SUPBASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3cG9yaHBzbnVqem5jYmR4dGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjAyMTcyOTUsImV4cCI6MTk3NTc5MzI5NX0.ZEQ583HrH3bG91azsQdUmZ9K-wuqxtbrSpgSPXiSo1E";
const supabaseClient = createClient(SUPABASE_URL, SUPBASE_ANON_KEY);
const htmltoText = (html) => {
  return html.replace(/<[^>]*>?/gm, "");
};
const index$1 = "";
const index = "";
const lineAwesome = "";
const supabaseFetch = async (table, query, type, authorSlug) => {
  const { data, error } = await supabaseClient.from(table).select(query).eq(type, authorSlug);
  return { error, data };
};
const fetchAuthor = async (authorSlug) => {
  const authors = await supabaseFetch("authors", "username, title, description, logoimg, faviconimg", "username", authorSlug);
  if (authors.error) {
    return { error: "Please check your internet connection & refresh the page", content: [], url: "authors" };
  }
  return { error: null, content: [authors.data[0]], url: "authors" };
};
const fetchPost = async (url) => {
  const postId = url.split("/posts/")[1].split("/")[0];
  var currentPost = await supabaseClient.from("posts").select(`title, post, authors!inner(*), category!inner(*)`).eq("posttitle", postId);
  if (currentPost.error) {
    return { error: "Please check your internet connection & refresh the page", content: [], url: "posts" };
  }
  const { title, post, authors } = currentPost.data[0];
  const postData = htmltoText(post);
  const contentData = { title, description: postData.substring(0, 200), username: authors.username, logoimg: authors.logoimg, faviconimg: authors.faviconimg };
  return { error: null, content: [contentData], url: "posts" };
};
const fetchCat = async (url) => {
  const catId = url.split("/category/")[1].split("/")[0];
  var currentCat = await supabaseClient.from("category").select(`name, posts, authors!inner(*)`).eq("title", catId);
  if (currentCat.error) {
    return { error: "Please check your internet connection & refresh the page", content: [], url: "posts" };
  }
  const { name, posts, authors } = currentCat.data[0];
  const contentData = { title: name, description: posts + " posts", username: authors.username, logoimg: authors.logoimg, faviconimg: authors.faviconimg };
  return { error: null, content: [contentData], url: "posts" };
};
async function render(url, subdomain) {
  console.log("Rendering", url, subdomain);
  const data = async () => {
    if (url.search("/posts/") != -1) {
      return await fetchPost(url);
    } else if (url.search("/category/") != -1) {
      return await fetchCat(url);
    } else {
      return await fetchAuthor(subdomain);
    }
  };
  const actualData = await data();
  return { appHtml: ReactDOMServer.renderToString(
    /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(StaticRouter, { location: url, children: /* @__PURE__ */ jsx(AppSever, { data: actualData }) }) })
  ), actualData };
}
export {
  render
};
