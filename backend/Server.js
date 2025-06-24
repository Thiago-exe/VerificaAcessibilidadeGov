const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const axeSource = fs.readFileSync(
  require.resolve("axe-core/axe.min.js"),
  "utf8"
);
const ptbr = require("axe-core/locales/pt_BR.json");
const emagRulesScript = fs.readFileSync(
  path.join(__dirname, "public/scripts/axe-emag-rules.js"),
  "utf8"
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  "/screenshots",
  express.static(path.join(__dirname, "public/screenshots"))
);

app.post("/analise", async (req, res) => {
  const { url, runMode } = req.body;
  let browser;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ erro: "URL inválida" });
  }

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 120000 });

    await page.evaluate(axeSource);
    await page.evaluate((ptbrLocale) => {
      axe.configure({ locale: ptbrLocale });
    }, ptbr);
    await page.evaluate(emagRulesScript);

    let axeOptions = {};
    if (runMode === "emag") {
      axeOptions = { runOnly: { type: "tag", values: ["emag"] } };
    } else if (runMode === "wcag") {
      axeOptions = {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      };
    }

    const rawResult = await page.evaluate(
      (options) => axe.run(options),
      axeOptions
    );
    const resultado = JSON.parse(JSON.stringify(rawResult));

    const screenshotDir = path.join(__dirname, "public/screenshots");
    if (fs.existsSync(screenshotDir)) {
      fs.readdirSync(screenshotDir).forEach((f) =>
        fs.unlinkSync(path.join(screenshotDir, f))
      );
    } else {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // --- LÓGICA DE SCREENSHOT ATUALIZADA ---

    // 1. LISTA DAS REGRAS QUE NÃO PRECISAM DE SCREENSHOT
    const pageLevelRuleIds = [
      "emag-content-before-menu",
      "emag-has-heading",
      "emag-heading-hierarchy",
      "emag-lang-attribute",
      "emag-page-title",
      "emag-ancoras-acesskey-unico",
      "emag-ancoras-primeiro-link",
      "emag-ancoras-bloco-existente",
      "emag-ancoras-bloco",
      "emag-semantic-landmarks-missing",
      "emag-video-presence",
      "emag-audio-presence",
      "emag-video-content-presence",
      "emag-audio-content-presence",
      "emag-tabindex-range",
      "emag-tabindex-presence",
      "emag-adjacent-links-without-separation",
      "emag-broken-links", // Adicionada para garantir que não tente tirar print de URL
    ];

    for (const violacao of resultado.violations) {
      // 2. VERIFICAÇÃO PARA PULAR REGRAS DE NÍVEL DE PÁGINA
      if (pageLevelRuleIds.includes(violacao.id)) {
        // Pula para a próxima violação, ignorando o loop de screenshot
        continue;
      }

      for (const node of violacao.nodes) {
        const selector = Array.isArray(node.target)
          ? node.target[0]
          : node.target;
        node.snippet = node.html;

        if (typeof selector === "string" && !selector.startsWith("http")) {
          try {
            const el = await page.$(selector);
            if (el) {
              const isVisible = await el.isIntersectingViewport();
              if (isVisible) {
                await page.addStyleTag({
                  content: `${selector} { outline: 4px solid red !important; }`,
                });
                await el.scrollIntoViewIfNeeded?.();
                const filename = `violacao-${violacao.id}-${Math.random()}.png`;
                const filepath = path.join(screenshotDir, filename);
                await el.screenshot({ path: filepath });
                node.screenshot = `http://204.236.197.245:3001/screenshots/${filename}`;
              }
            }
          } catch (e) {
            console.log(
              `Ignorando erro de screenshot para o seletor "${selector}": ${e.message}`
            );
          }
        }
      }
    }

    await browser.close();
    res.json(resultado);
  } catch (erro) {
    if (browser) await browser.close();
    console.error("Erro durante análise:", erro);
    res.status(500).json({ erro: erro.message });
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
