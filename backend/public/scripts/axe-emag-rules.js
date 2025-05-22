(() => {
  const emagChecks = [
    // Alt nas imagens
    {
      id: "imagem-alt-emag",
      evaluate: function (node) {
        return (
          node.hasAttribute("alt") && node.getAttribute("alt").trim() !== ""
        );
      },
    },
    // Ancora para bloco
    {
      id: "ancora-para-bloco",
      evaluate: function (node) {
        if (
          node.tagName.toLowerCase() === "a" &&
          node.hasAttribute("href") &&
          node.getAttribute("href").startsWith("#")
        ) {
          const targetId = node.getAttribute("href").substring(1);
          const target =
            document.getElementById(targetId) ||
            document.getElementsByName(targetId)[0];
          if (!target) return false;

          const style = window.getComputedStyle(node);
          const isInvisiblyHidden =
            style.display === "none" ||
            style.visibility === "hidden" ||
            (style.height === "0px" &&
              style.width === "0px" &&
              style.overflow === "hidden");

          return !isInvisiblyHidden;
        }
        return true;
      },
    },
    // Accesskeys únicas
    {
      id: "accesskey-unico",
      evaluate: function () {
        const allAccesskeys = Array.from(
          document.querySelectorAll("[accesskey]")
        ).map((el) => el.getAttribute("accesskey").toLowerCase());
        const duplicates = allAccesskeys.filter(
          (key, idx, self) => self.indexOf(key) !== idx
        );
        return duplicates.length === 0;
      },
    },
    // Primeiro link da pagina deve pular pro conteudo
    {
      id: "primeiro-link-para-conteudo",
      evaluate: function () {
        const links = Array.from(document.querySelectorAll("a")).filter(
          (el) => {
            const style = window.getComputedStyle(el);
            return (
              el.offsetParent !== null &&
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          }
        );

        if (links.length === 0) return false;

        const primeiroLink = links[0];
        if (!primeiroLink.hasAttribute("href")) return false;

        const href = primeiroLink.getAttribute("href");
        if (!href.startsWith("#")) return false;

        const targetId = href.substring(1);
        const target =
          document.getElementById(targetId) ||
          document.getElementsByName(targetId)[0];
        if (!target) return false;

        const idsAceitaveis = ["conteudo", "main", "principal", "content"];
        return idsAceitaveis.includes(targetId.toLowerCase());
      },
    },
    // verificando css-inline
    {
      id: "css-inline-check",
      evaluate: function (node) {
        // Se existe atributo style, retorna true
        return node.hasAttribute("style");
      },
    },
    // Validar css interno
    {
      id: "css-internal-check",
      evaluate: function (node) {
        return node.tagName.toLowerCase() === "style";
      },
    },
  ];

  const emagRules = [
    {
      id: "img-sem-alt-emag",
      selector: "img",
      any: ["imagem-alt-emag"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "wcag2a", "imagem"],
      impact: "serious",
      metadata: {
        description:
          "Deve ser fornecida uma descrição para as imagens da página, utilizando-se, para tanto o atributo alt.",
        help: "EMAG 3.1 R3.6.1 - Imagem sem declaração do atributo ALT.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6",
      },
    },
    {
      id: "emag-ancoras-bloco",
      selector: "body",
      any: ["ancora-para-bloco", "primeiro-link-para-conteudo"],
      all: ["accesskey-unico"],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "moderate",
      metadata: {
        description:
          "Deve haver âncoras acessíveis no início da página que permitam pular para blocos de conteúdo como menu, conteúdo principal e busca.",
        help: "EMAG 3.1 R1.5 - Falta de âncoras acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    {
      id: "css-inline",
      selector: "[style]",
      any: ["css-inline-check"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "padrões", "html"],
      impact: "minor",
      metadata: {
        description:
          "Evitar o uso de CSS inline. Respeite os padrões Web HTML. Utilize folhas de estilo externas.",
        help: "EMAG 3.1 R1.1.3 - Presença de CSS(s) in-line.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.1",
      },
    },
    {
      id: "css-internal",
      selector: "style",
      any: ["css-internal-check"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "padrões", "html"],
      impact: "minor",
      metadata: {
        description:
          "Evitar o uso de CSS interno. Respeite os padrões Web HTML. Utilize folhas de estilo externas.",
        help: "EMAG 3.1 R1.1.4 - Presença de CSS(s) interno.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.1",
      },
    },
  ];

  axe.configure({
    checks: emagChecks,
    rules: emagRules,
  });
})();
