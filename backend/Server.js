const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axeSource = fs.readFileSync(
  require.resolve("axe-core/axe.min.js"),
  "utf8"
);
const ptbr = require("axe-core/locales/pt_BR.json"); // Localização em portugues do Axe-Core padrão
// abandonado const regrasEmag = require("./emag-rules"); //Regras personalizadas do Emag
const app = express();

const emagRulesScript = fs.readFileSync(
  path.join(__dirname, "public/scripts/axe-emag-rules.js"),
  "utf8"
); // tentativa

app.use(cors());
app.use(express.json());
app.use(
  "/screenshots",
  express.static(path.join(__dirname, "public/screenshots"))
);

app.post("/analise", async (req, res) => {
  const { url } = req.body;
  const screenshots = [];

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ erro: "URL inválida" });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    await page.evaluate(axeSource);
    await page.evaluate((ptbrLocale) => {
      axe.configure({ locale: ptbrLocale });
    }, ptbr);

    await page.evaluate(emagRulesScript); // já tem axe.configure() dentro
    /* await page.evaluate(
      (axeSource, regrasEmag) => {
        eval(axeSource);
        axe.configure(regrasEmag);
      },
      axeSource,
      regrasEmag
    ); // Carregamento das regras personalizadas 
    // abandonado*/

    const rawResult = await page.evaluate(() => axe.run());
    const resultado = JSON.parse(JSON.stringify(rawResult)); // 👈 Clona o objeto

    // Criar pasta se não existir
    const screenshotDir = path.join(__dirname, "public/screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Apagar imagens antigas
    fs.readdirSync(screenshotDir).forEach((f) =>
      fs.unlinkSync(path.join(screenshotDir, f))
    );

    for (const [i, violacao] of resultado.violations.entries()) {
      for (const [j, node] of violacao.nodes.entries()) {
        const selector = node.target[0];
        try {
          // Adiciona destaque visual
          await page.addStyleTag({
            content: `${selector} { outline: 4px solid red !important; }`,
          });

          const el = await page.$(selector);
          if (el) {
            await el.scrollIntoViewIfNeeded?.();
            const filename = `violacao-${i}-${j}.png`;
            const filepath = path.join(screenshotDir, filename);
            await el.screenshot({ path: filepath });

            // Incluir no retorno
            node.screenshot = `http://localhost:3001/screenshots/${filename}`;
            node.snippet = node.html; // 👈 Adiciona aqui o trecho HTML violado
          }
        } catch (e) {
          console.log(`Erro no seletor ${selector}:`, e.message);
        }
      }
    }
    await browser.close();
    res.json(resultado); // retorna o resultado da execução do axe-core
  } catch (erro) {
    console.error("Erro durante análise:", erro);
    res.status(500).json({ erro: erro.message });
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
