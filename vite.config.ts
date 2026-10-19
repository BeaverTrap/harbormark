import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function publicSky(): Plugin {
  let base = "/";
  return {
    name: "public-sky",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html) {
      const style = `<style>:root{--sky-image:url("${base}sky-bg.jpg?v=9");--stars-image:url("${base}stars.png");--moon-image:url("${base}MOON.png");}</style>`;
      return html.replace("</head>", `${style}</head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), publicSky()],
  server: { port: 5173 },
});
