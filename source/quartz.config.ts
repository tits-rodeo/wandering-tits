import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "The Wandering Tits Wiki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "wandering.tits.rodeo",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      "- - -/dungeon_alchemist",
      "- - -/maps",
      "- - -/other",
      "- - -/templates",
      "0. DM Screen",
      "1. Game",
    ],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Cinzel Decorative",
        body: "PT Serif",
        code: "Fira Code",
      },
      colors: {
        // Matches the "ITS Theme" (wotc-beyond variant, light/paper mode) used
        // in the source Obsidian vault. Dark mode is set identical to light
        // mode since the vault has no dark variant and the toggle is removed
        // from the layout.
        lightMode: {
          light: "#fff9f0",
          lightgray: "#fbe2c5",
          gray: "#e2b7a3",
          darkgray: "#412f2f",
          dark: "#c14343",
          secondary: "#c75959",
          tertiary: "#cd645e",
          highlight: "rgba(199, 89, 89, 0.15)",
          textHighlight: "#fae0be99",
        },
        darkMode: {
          light: "#fff9f0",
          lightgray: "#fbe2c5",
          gray: "#e2b7a3",
          darkgray: "#412f2f",
          dark: "#c14343",
          secondary: "#c75959",
          tertiary: "#cd645e",
          highlight: "rgba(199, 89, 89, 0.15)",
          textHighlight: "#fae0be99",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.RemoveDMHeaderSections(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [
      Plugin.RemoveDrafts(),
      Plugin.ExplicitPublish(),
      Plugin.RequireTag({ tag: "wandering-tits" }),
    ],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
