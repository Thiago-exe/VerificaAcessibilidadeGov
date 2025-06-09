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
    // Ancora para bloco 1.5.4
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
    // 1.5.1
    {
      id: "check-anchor-skip-links-presence",
      evaluate: function (node) {
        const skipLinks = node.querySelectorAll('a[href^="#"]');
        return skipLinks.length > 0;
      },
      metadata: {
        description:
          "Garante que existam âncoras que permitam saltar entre seções da página.",
      },
    },
    // 1.5.2
    {
      id: "check-anchor-skip-links-target",
      evaluate: function (node) {
        const anchors = Array.from(node.querySelectorAll('a[href^="#"]'));
        const ids = new Set(
          Array.from(node.querySelectorAll("[id]")).map((el) => el.id)
        );

        return anchors.every((anchor) => {
          const href = anchor.getAttribute("href").slice(1); // Remove o #
          return href.length === 0 || ids.has(href);
        });
      },
      metadata: {
        description:
          "Garante que todas as âncoras de salto tenham um destino correspondente na página.",
      },
    },
    // Accesskeys únicas 1.5.11
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
    // Primeiro link da pagina deve pular pro conteudo 1.5.9
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
    // Presença de JavaScript inline
    {
      id: "js-inline-check",
      evaluate: function (node) {
        const eventAttributes = [
          "onload",
          "onunload",
          "onblur",
          "onchange",
          "onfocus",
          "onsearch",
          "onselect",
          "onsubmit",
          "onkeydown",
          "onkeypress",
          "onkeyup",
          "onclick",
          "ondblclick",
          "onmousedown",
          "onmousemove",
          "onmouseout",
          "onmouseover",
          "onmouseup",
          "onmousewheel",
          "oncopy",
          "oncut",
          "onpaste",
          "onabort",
        ];

        return eventAttributes.some((attr) => node.hasAttribute(attr));
      },
    },
    // Presença de JavaScript interno
    {
      id: "js-internal-check",
      evaluate: function (node) {
        return node.tagName.toLowerCase() === "script";
      },
    },
    // 1.3.1
    {
      id: "check-has-heading",
      evaluate: function (node) {
        const hasHeading =
          node.querySelector("h1, h2, h3, h4, h5, h6") !== null;
        return hasHeading;
      },
      metadata: {
        description: "Verifica se existe pelo menos um cabeçalho na página.",
      },
    },
    // 1.3.2
    {
      id: "check-heading-hierarchy",
      evaluate: function (node) {
        const headings = node.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let currentLevel = 0;

        for (const heading of headings) {
          const level = parseInt(heading.tagName[1]);

          if (level > currentLevel + 1) {
            return false; // Pulo de nível detectado
          }

          currentLevel = level;
        }

        return true; // Hierarquia correta
      },
      metadata: {
        description:
          "Garante que os cabeçalhos seguem uma hierarquia sequencial adequada.",
      },
    },
    // 1.3.4
    {
      id: "check-only-h1",
      evaluate: function (node) {
        const h1 = node.querySelectorAll("h1").length;
        const others = node.querySelectorAll("h2, h3, h4, h5, h6").length;

        return !(h1 > 0 && others === 0);
      },
      metadata: {
        description:
          "Garante que existem outros níveis além de <h1> se <h1> estiver presente.",
      },
    },
    // 1.3.6
    {
      id: "check-multiple-h1",
      evaluate: function (node) {
        const h1Count = node.querySelectorAll("h1").length;
        return h1Count <= 1;
      },
      metadata: {
        description: "Garante que não existam múltiplos <h1> na página.",
      },
    },
    // 1.4.1
    {
      id: "check-content-before-menu",
      evaluate: function (node) {
        const contentSelectors = [
          "main",
          "#content",
          "#wrapper",
          '[role="main"]',
        ];
        const menuSelectors = ["nav", "#menu", '[role="navigation"]'];

        const content = node.querySelector(contentSelectors.join(","));
        const menu = node.querySelector(menuSelectors.join(","));

        if (!content || !menu) {
          return true; // Se não existe um dos dois, não se aplica
        }

        const position = content.compareDocumentPosition(menu);

        return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      },
    },
    // 1.4.3
    {
      id: "check-tabindex-presence",
      evaluate: function (node) {
        return node.querySelectorAll("[tabindex]").length === 0;
      },
      metadata: {
        description: "Garante que não há uso do atributo tabindex na página.",
      },
      metadata: {
        description:
          "Garante que o bloco de conteúdo vem antes do menu no HTML.",
      },
    },
    // 1.4.6
    {
      id: "check-tabindex-range",
      evaluate: function (node) {
        const elements = Array.from(node.querySelectorAll("[tabindex]"));

        return elements.every((el) => {
          const tabindex = parseInt(el.getAttribute("tabindex"), 10);
          return tabindex === -1 || (tabindex >= 0 && tabindex <= 32767);
        });
      },
      metadata: {
        description:
          "Garante que os valores de tabindex estão no intervalo permitido (-1 ou 0 a 32767).",
      },
    },
    // 1.6.1
    {
      id: "check-table-exists",
      evaluate: function (node) {
        return node.querySelectorAll("table").length > 0;
      },
      metadata: {
        description: "Verifica se existe uma tabela na página pra avisar.",
      },
    },
    {
      id: "check-form-inside-table",
      evaluate: function (node) {
        const tables = node.querySelectorAll("table");
        for (const table of tables) {
          if (table.querySelector("form")) {
            return true;
          }
        }
        return false;
      },
      metadata: {
        description: "Verifica se há formulário dentro de uma tabela.",
      },
    },
    // 1.7.1
    {
      id: "check-adjacent-links-without-separation",
      evaluate: function (node) {
        const links = Array.from(node.querySelectorAll("a"));
        for (let i = 0; i < links.length - 1; i++) {
          const current = links[i];
          const next = links[i + 1];

          // Verifica se os dois links são irmãos diretos
          if (current.parentElement === next.parentElement) {
            const children = Array.from(current.parentElement.childNodes);
            const currentIndex = children.indexOf(current);
            const nextIndex = children.indexOf(next);

            if (nextIndex === currentIndex + 1) {
              // Verifica se há texto separando os links
              const between = children.slice(currentIndex + 1, nextIndex);
              const hasSeparator = between.some((node) => {
                return (
                  (node.nodeType === Node.TEXT_NODE &&
                    node.textContent.trim() !== "") ||
                  (node.nodeType === Node.ELEMENT_NODE &&
                    node.tagName.toLowerCase() !== "a")
                );
              });

              if (!hasSeparator) {
                return true; // Encontrou links adjacentes sem separação
              }
            }
          }
        }
        return false;
      },
      metadata: {
        description:
          "Verifica se há links adjacentes sem separação textual ou por elementos.",
      },
    },
    //1.8.1
    {
      id: "check-semantic-landmarks-missing",
      evaluate: function (node) {
        const landmarks = [
          "header",
          "footer",
          "section",
          "aside",
          "nav",
          "article",
        ];
        return !landmarks.some((tag) => node.querySelector(tag));
      },
      metadata: {
        description:
          "Garante que há ausência total de landmarks semânticas (header, footer, section, aside, nav, article).",
      },
    },
    {
      id: "check-link-target-blank",
      evaluate: function (node) {
        const links = node.querySelectorAll('a[target="_blank"]');
        return links.length > 0;
      },
      metadata: {
        description:
          "Verifica se há links com target='_blank', que abrem em nova aba ou janela.",
      },
    },
    // 2.1.2
    {
      id: "check-mouse-only-events",
      evaluate: function (node) {
        const mouseEvents = [
          "onmousedown",
          "onmouseup",
          "onmouseover",
          "onmouseout",
        ];
        const keyboardEvents = [
          "onkeydown",
          "onkeyup",
          "onkeypress",
          "onfocus",
          "onblur",
        ];

        const elements = node.querySelectorAll("*");
        let hasMouseEventWithoutKeyboard = false;

        elements.forEach((el) => {
          const hasMouse = mouseEvents.some((ev) => el.hasAttribute(ev));
          const hasKeyboard = keyboardEvents.some((ev) => el.hasAttribute(ev));
          if (hasMouse && !hasKeyboard) {
            hasMouseEventWithoutKeyboard = true;
          }
        });

        return !hasMouseEventWithoutKeyboard;
      },
      metadata: {
        description:
          "Garante que funcionalidades controladas por mouse também estejam disponíveis por teclado.",
      },
    },
    // 2.1.6
    {
      id: "check-dblclick-event",
      evaluate: function (node) {
        const elements = node.querySelectorAll("[ondblclick]");
        return elements.length === 0;
      },
      metadata: {
        description: "Verifica se não há uso do evento ondblclick no HTML.",
      },
    },
    //2.1.8
    {
      id: "check-event-on-non-interactive",
      evaluate: function (node) {
        const interactiveTags = [
          "a",
          "button",
          "input",
          "textarea",
          "select",
          "label",
          "option",
          "details",
          "summary",
        ];

        const eventAttributes = [
          "onclick",
          "ondblclick",
          "onmousedown",
          "onmouseup",
          "onmouseover",
          "onmouseout",
          "onkeydown",
          "onkeyup",
          "onkeypress",
          "onfocus",
          "onblur",
          "onchange",
        ];

        const elements = node.querySelectorAll("*");
        let hasInvalidEvent = false;

        elements.forEach((el) => {
          const tagName = el.tagName.toLowerCase();
          const isInteractive = interactiveTags.includes(tagName);

          const hasEvent = eventAttributes.some((ev) => el.hasAttribute(ev));

          if (!isInteractive && hasEvent) {
            hasInvalidEvent = true;
          }
        });

        return !hasInvalidEvent;
      },
      metadata: {
        description:
          "Garante que eventos não estejam aplicados a elementos não interativos.",
      },
    },
    //2.2.1
    {
      id: "check-noscript-with-script",
      evaluate: function (node) {
        const hasScript = node.querySelectorAll("script").length > 0;
        const hasNoScript = node.querySelectorAll("noscript").length > 0;
        return !hasScript || hasNoScript;
      },
      metadata: {
        description:
          "Garante que exista um elemento <noscript> quando houver <script> na página.",
      },
    },
    // 2.2.2
    {
      id: "check-object-has-text",
      evaluate: function (node) {
        const objects = node.querySelectorAll("object");
        let valid = true;

        objects.forEach((obj) => {
          const textContent = obj.textContent.trim();
          if (textContent === "") {
            valid = false;
          }
        });

        return valid;
      },
      metadata: {
        description:
          "Garante que os elementos <object> tenham conteúdo alternativo textual.",
      },
    },
    // 2.2.3
    {
      id: "check-embed-has-text",
      evaluate: function (node) {
        const embeds = node.querySelectorAll("embed");
        let valid = true;

        embeds.forEach((embed) => {
          const textContent = embed.textContent.trim();
          if (textContent === "") {
            valid = false;
          }
        });

        return valid;
      },
      metadata: {
        description:
          "Garante que os elementos <embed> tenham conteúdo alternativo textual.",
      },
    },
    //2.2.4
    {
      id: "check-applet-has-text",
      evaluate: function (node) {
        const applets = node.querySelectorAll("applet");
        let valid = true;

        applets.forEach((applet) => {
          const textContent = applet.textContent.trim();
          if (textContent === "") {
            valid = false;
          }
        });

        return valid;
      },
      metadata: {
        description:
          "Garante que os elementos <applet> tenham conteúdo alternativo textual.",
      },
    },
    //2.3.1
    {
      id: "check-auto-refresh",
      evaluate: function (node) {
        const metaRefresh = Array.from(node.querySelectorAll("meta")).some(
          (el) =>
            (el.getAttribute("http-equiv") || "").toLowerCase() === "refresh"
        );

        const scripts = node.querySelectorAll("script");
        let hasSetTimeoutOrSetInterval = false;

        scripts.forEach((script) => {
          const content = script.innerText.toLowerCase();
          if (
            content.includes("settimeout") ||
            content.includes("setinterval")
          ) {
            hasSetTimeoutOrSetInterval = true;
          }
        });

        return !(metaRefresh || hasSetTimeoutOrSetInterval);
      },
      metadata: {
        description:
          "Verifica se a página possui atualização automática via <meta http-equiv='refresh'> ou funções JavaScript como setTimeout e setInterval.",
      },
    },
    // 2.4.1
    {
      id: "check-auto-redirect",
      evaluate: function (node) {
        // Verificar se existe meta http-equiv="refresh" com content
        const metaRedirect = Array.from(node.querySelectorAll("meta")).some(
          (el) =>
            (el.getAttribute("http-equiv") || "").toLowerCase() === "refresh" &&
            el.hasAttribute("content")
        );

        // Verificar se existe script com window.location
        const scripts = node.querySelectorAll("script");
        let hasWindowLocation = false;

        scripts.forEach((script) => {
          const content = script.innerText.toLowerCase();
          if (content.includes("window.location")) {
            hasWindowLocation = true;
          }
        });

        return !(metaRedirect || hasWindowLocation);
      },
      metadata: {
        description:
          "Verifica se a página possui redirecionamento automático via <meta http-equiv='refresh'> com content ou window.location em script.",
      },
    },
    // 2.6.1
    {
      id: "check-blink-element",
      evaluate: function (node) {
        return node.querySelectorAll("blink").length === 0;
      },
      metadata: {
        description: "Garante que não exista o elemento <blink> na página.",
      },
    },
    // 2.6.2
    {
      id: "check-marquee-element",
      evaluate: function (node) {
        return node.querySelectorAll("marquee").length === 0;
      },
      metadata: {
        description: "Garante que não exista o elemento <marquee> na página.",
      },
    },
    // 2.6.3
    {
      id: "check-animated-gif",
      evaluate: function (node) {
        const gifs = Array.from(node.querySelectorAll("img")).filter((img) => {
          const src = (img.getAttribute("src") || "").toLowerCase();
          return src.endsWith(".gif");
        });

        return gifs.length === 0;
      },
      metadata: {
        description:
          "Verifica a presença de imagens GIF que podem gerar intermitência ou movimentação na tela.",
      },
    },
    //3.1.1
    {
      id: "check-html-lang",
      evaluate: function (node) {
        // Verifica se o elemento html possui o atributo lang
        const hasLang = node.hasAttribute("lang");

        // Para XHTML, verifica também o atributo xml:lang
        const hasXmlLang = node.hasAttribute("xml:lang");

        // Retorna true se pelo menos um dos atributos estiver presente
        return hasLang || hasXmlLang;
      },
      metadata: {
        description:
          "Verifica se o elemento HTML possui o atributo lang ou xml:lang definido.",
      },
    },
    // 3.2.1
    {
      id: "check-visible-text-lang",
      evaluate: function (node) {
        // Ignora elementos sem texto visível
        if (!axe.commons.text.visible(node, false)) {
          return true; // Não aplicável = passa no teste
        }

        // Ignora se já tem lang declarado no próprio elemento ou em algum ancestral
        const hasLangAncestor = axe.commons.dom.findUp(node, "[lang]");
        return !hasLangAncestor ? false : true;
      },
      metadata: {
        description:
          "Verifica se elementos com texto visível têm atributo lang ou herdam de ancestral.",
      },
    },
    //3.3
    {
      id: "check-page-title",
      evaluate: function () {
        const title = document.title;
        // Verifica se o título existe e não está vazio
        return !!title && title.trim().length > 0;
      },
      metadata: {
        description: "Verifica se a página possui um título não vazio.",
      },
    },
    // 3.5.2
    {
      id: "check-link-url-text",
      evaluate: function (node) {
        const urlRegex = /^(https?:\/\/|www\.|\/)[^\s]+$/;
        const linkText = node.textContent.trim();
        return !urlRegex.test(linkText);
      },
      metadata: {
        description: "Verifica se o texto do link está em formato de URL.",
      },
    },
    //3.5.3
    {
      id: "check-empty-link",
      evaluate: function (node) {
        return (
          node.textContent.trim().length > 0 ||
          node.querySelector('img[alt][alt!=""]')
        );
      },
      metadata: {
        description: "Verifica se o link tem conteúdo descritivo.",
      },
    },
    // 3.5.4
    {
      id: "check-title-only-link",
      evaluate: function (node) {
        const hasTitle =
          node.hasAttribute("title") &&
          node.getAttribute("title").trim().length > 0;
        const hasText = node.textContent.trim().length > 0;
        return !(hasTitle && !hasText);
      },
      metadata: {
        description: "Verifica se o link não depende apenas do atributo title.",
      },
    },
    // 3.5.5
    {
      id: "check-image-link-alt",
      evaluate: function (node) {
        const images = node.querySelectorAll("img");
        if (images.length === 0) return true;

        return Array.from(images).every((img) => {
          return (
            img.hasAttribute("alt") && img.getAttribute("alt").trim().length > 0
          );
        });
      },
      metadata: {
        description:
          "Verifica se links contendo imagens possuem texto alternativo.",
      },
    },
    // 3.5.6
    {
      id: "check-generic-link-text",
      evaluate: function (node) {
        const genericTerms = [
          "clique aqui",
          "leia mais",
          "veja mais",
          "veja aqui",
          "clique",
          "acesse aqui",
          "clique para acessar",
          "aqui",
        ];
        const linkText = node.textContent.trim().toLowerCase();

        return !genericTerms.some(
          (term) => linkText.startsWith(term) || linkText.includes(` ${term}`)
        );
      },
      metadata: {
        description: "Verifica se o texto do link não é genérico.",
      },
    },
    // 3.5.10
    {
      id: "check-duplicate-href-different-text",
      evaluate: function () {
        const links = Array.from(document.querySelectorAll("a[href]"));
        const hrefMap = new Map();
        let hasViolation = false;

        links.forEach((link) => {
          const href = link.href.trim(); // Mantém âncoras, respeita o destino completo
          const text = link.innerText.trim().replace(/\s+/g, " "); // Texto visível

          if (hrefMap.has(href)) {
            const previousText = hrefMap.get(href);
            if (previousText !== text) {
              console.log(
                `⚠️ Violação detectada: href "${href}" com textos "${previousText}" e "${text}"`
              );
              hasViolation = true;
            }
          } else {
            hrefMap.set(href, text);
          }
        });

        return !hasViolation;
      },
      metadata: {
        description:
          "Verifica se links com mesmo destino têm textos diferentes.",
      },
    },
    //3.5.11
    {
      id: "check-same-text-different-href",
      evaluate: function (node, options, virtualNode) {
        const text = virtualNode.children
          .reduce((acc, child) => {
            return child.actualNode.nodeType === 3
              ? acc + child.actualNode.textContent
              : acc;
          }, "")
          .trim();
        if (!text) return true; // Não analisa texto vazio
        const links = Array.from(document.querySelectorAll(`a[href]`));
        const sameTextLinks = links.filter(
          (l) => l.textContent.trim() === text && l.href !== node.href
        );

        return sameTextLinks.length === 0;
      },
      metadata: {
        description:
          "Verifica se existem outros links com mesmo texto para destinos diferentes.",
      },
    },
    //3.5.12
    {
      id: "check-duplicate-title-text",
      evaluate: function (node) {
        const title = node.getAttribute("title") || "";
        const text = node.textContent.trim();
        return title !== text;
      },
      metadata: {
        description: "Verifica se o title é igual ao texto do link.",
      },
    },
    // 3.5.13
    {
      id: "check-long-link-text",
      evaluate: function (node) {
        const text = node.textContent.trim();
        return text.length <= 2000;
      },
      metadata: {
        description: "Verifica se o texto do link é muito longo.",
      },
    },
    // 3.5.14
    {
      id: "check-broken-links",
      evaluate: async function (node) {
        const href = node.getAttribute("href");
        if (!href) return true;

        try {
          const response = await fetch(href, { method: "HEAD" });
          return response.ok;
        } catch {
          return false;
        }
      },
      metadata: {
        description: "Verifica se o link está quebrado.",
      },
    },
    // 3.5.15
    {
      id: "check-malformed-urls",
      evaluate: function (node) {
        const href = node.getAttribute("href") || "";
        const invalidProtocols = ["file:", "ftp:"];
        const urlRegex = /^(https?:|mailto:|tel:)\/\/[^\s/$.?#].[^\s]*$/i;

        if (invalidProtocols.some((p) => href.startsWith(p))) return false;
        if (href.startsWith("http") && !urlRegex.test(href)) return false;

        return true;
      },
      metadata: {
        description: "Verifica se o URL está mal formatado.",
      },
    },
    //3.6.2
    {
      id: "check-img-alt",
      evaluate: function (node) {
        // Ignora imagens decorativas (alt vazio válido)
        const isDecorative =
          node.getAttribute("role") === "presentation" ||
          node.getAttribute("aria-hidden") === "true";

        return (
          isDecorative ||
          (node.hasAttribute("alt") && node.getAttribute("alt").trim() !== "")
        );
      },
      metadata: {
        description:
          "Verifica se imagens informativas possuem atributo alt descritivo.",
      },
    },
    //3.6.3
    {
      id: "check-img-alt-filename",
      evaluate: function (node) {
        if (!node.hasAttribute("alt")) return true;

        const altText = node.getAttribute("alt").trim();
        const src = node.getAttribute("src") || "";
        const filename = src.split("/").pop().split(".")[0];

        return altText !== filename;
      },
      metadata: {
        description: "Verifica se o alt não é igual ao nome do arquivo.",
      },
    },
    //3.6.4
    {
      id: "check-img-generic-alt",
      evaluate: function (node) {
        if (!node.hasAttribute("alt")) return true;

        const altText = node.getAttribute("alt").trim().toLowerCase();
        const genericTerms = [
          "imagem",
          "foto",
          "figura",
          "fotografia",
          "alt",
          "imagem de",
          "foto de",
        ];

        return !genericTerms.some(
          (term) => altText === term || altText.startsWith(term + " ")
        );
      },
      metadata: {
        description: "Verifica se o alt não contém termos genéricos.",
      },
    },
    //3.6.7
    {
      id: "check-img-same-alt-different-src",
      evaluate: function (node, options, virtualNode, context) {
        const currentAlt = node.getAttribute("alt") || "";
        const currentSrc = node.getAttribute("src") || "";

        if (!currentAlt) return true;

        const images = context.document.querySelectorAll("img[alt]");
        for (let img of images) {
          if (
            img !== node &&
            img.getAttribute("alt") === currentAlt &&
            img.getAttribute("src") !== currentSrc
          ) {
            return false;
          }
        }
        return true;
      },
      metadata: {
        description: "Verifica se imagens com mesmo alt têm src diferente.",
      },
    },
    //3.6.8
    {
      id: "check-img-duplicate-alt-title",
      evaluate: function (node) {
        const alt = node.getAttribute("alt") || "";
        const title = node.getAttribute("title") || "";
        return alt !== title;
      },
      metadata: {
        description: "Verifica se alt e title não são idênticos.",
      },
    },
    // 3.7.1
    {
      id: "check-image-map-alt",
      evaluate: function (node) {
        // Verifica se é uma imagem com mapa
        if (node.nodeName === "IMG" && node.hasAttribute("usemap")) {
          const alt = node.getAttribute("alt") || "";
          return alt.trim() !== "";
        }
        // Verifica se é uma área do mapa
        else if (node.nodeName === "AREA") {
          const alt = node.getAttribute("alt") || "";
          const ariaLabel = node.getAttribute("aria-label") || "";
          return alt.trim() !== "" || ariaLabel.trim() !== "";
        }
        return true;
      },
      metadata: {
        description:
          "Verifica se imagens com usemap e áreas de mapa possuem descrição alternativa.",
      },
    },
    // 3.9.1
    {
      id: "check-table-caption-summary",
      evaluate: function (node) {
        // Verifica se tem <caption> ou summary
        const hasCaption = node.querySelector("caption") !== null;
        const hasSummary =
          node.hasAttribute("summary") &&
          node.getAttribute("summary").trim() !== "";

        // Tabelas de layout não precisam
        const isLayoutTable =
          node.getAttribute("role") === "presentation" ||
          node.getAttribute("role") === "none";

        return isLayoutTable || hasCaption || hasSummary;
      },
      metadata: {
        description: "Verifica se tabelas de dados possuem caption ou summary.",
      },
    },
    //3.10.1
    {
      id: "check-table-cell-association",
      evaluate: function (node) {
        // Ignora tabelas de layout
        if (
          node.getAttribute("role") === "presentation" ||
          node.getAttribute("role") === "none"
        ) {
          return true;
        }

        // Verifica células de dados (td)
        const dataCells = node.querySelectorAll(
          "td:not([headers]):not([scope])"
        );
        if (dataCells.length > 0) return false;

        // Verifica células de cabeçalho (th)
        const headerCells = node.querySelectorAll(
          "th:not([scope]):not([id]):not([headers])"
        );
        if (headerCells.length > 0) return false;

        // Verifica estrutura semântica (thead/tbody)
        const hasSemanticStructure =
          node.querySelector("thead, tbody") !== null;
        return hasSemanticStructure;
      },
      metadata: {
        description:
          "Verifica se tabelas de dados possuem células adequadamente associadas.",
      },
    },
    // 3.11.2
    {
      id: "check-justified-align-attribute",
      evaluate: function (node) {
        return node.getAttribute("align") !== "justify";
      },
      metadata: {
        description: "Verifica se parágrafos não usam align='justify'.",
      },
    },
    //3.11.3
    {
      id: "check-justified-css",
      evaluate: function (node) {
        const style = window.getComputedStyle(node);
        return style.textAlign !== "justify";
      },
      metadata: {
        description:
          "Verifica se parágrafos não usam text-align: justify via CSS.",
      },
    },
    // 3.12.1
    {
      id: "check-abbr-title",
      evaluate: function (node) {
        // Verifica se é um elemento de sigla/abreviação
        const isAbbr = node.nodeName === "ABBR" || node.nodeName === "ACRONYM";

        // Se for, verifica se tem o atributo title com conteúdo
        return (
          !isAbbr ||
          (node.hasAttribute("title") &&
            node.getAttribute("title").trim() !== "")
        );
      },
      metadata: {
        description:
          "Verifica se elementos de sigla/abreviação possuem título descritivo.",
      },
    },
    // 4.1.2
    {
      id: "check-color-contrast",
      evaluate: function (node) {
        // Obtém estilos computados
        const style = window.getComputedStyle(node);
        const bgColor = style.backgroundColor;
        const textColor = style.color;

        // Ignora elementos invisíveis ou sem texto
        if (style.display === "none" || style.visibility === "hidden")
          return true;
        if (!axe.commons.text.visible(node, false)) return true;

        // Converte cores para formato hexadecimal
        const hexBg = axe.commons.color.parseColor(bgColor).toHexString();
        const hexText = axe.commons.color.parseColor(textColor).toHexString();

        // Calcula razão de contraste
        const contrast = axe.commons.color.getContrast(hexBg, hexText);

        // Requer no mínimo 4.5:1 para texto normal
        return contrast >= 4.5;
      },
      metadata: {
        description:
          "Verifica relação de contraste mínimo de 4.5:1 entre texto e fundo.",
      },
    },
    //4.4.1
    {
      id: "check-focus-visible",
      evaluate: function (node) {
        // Verifica se o elemento é focalizável
        if (!axe.commons.dom.isFocusable(node)) return true;

        // Obtém os estilos computados para :focus
        const style = window.getComputedStyle(node, ":focus");

        // Verifica propriedades visíveis de foco
        const hasFocusStyle =
          style.outlineStyle !== "none" ||
          style.outlineWidth !== "0px" ||
          style.outlineColor !== "transparent" ||
          style.boxShadow !== "none" ||
          style.borderStyle !== "none" ||
          style.borderWidth !== "0px" ||
          style.borderColor !== "transparent" ||
          style.backgroundColor !== "transparent";

        return hasFocusStyle;
      },
      metadata: {
        description:
          "Verifica se elementos focalizáveis têm estilo de foco visível.",
      },
    },
    {
      id: "check-focus-visible-styles",
      evaluate: function (node) {
        if (!axe.commons.dom.isFocusable(node)) return true;

        // Obtém estilos para :focus-visible (suportado nativamente) ou fallback para :focus
        const focusVisibleStyles =
          window.getComputedStyle(node, ":focus-visible") ||
          window.getComputedStyle(node, ":focus");

        // Verifica propriedades visíveis (incluindo soluções modernas como outline-offset)
        const hasVisibleFocus =
          (focusVisibleStyles.outlineStyle !== "none" &&
            focusVisibleStyles.outlineWidth !== "0px" &&
            focusVisibleStyles.outlineColor !== "transparent") ||
          (focusVisibleStyles.boxShadow !== "none" &&
            !focusVisibleStyles.boxShadow.includes("transparent")) ||
          (focusVisibleStyles.borderColor !==
            focusVisibleStyles.backgroundColor &&
            focusVisibleStyles.borderStyle !== "none" &&
            focusVisibleStyles.borderWidth !== "0px");

        // Verifica se o navegador suporta :focus-visible nativamente
        const supportsFocusVisible = CSS.supports("selector(:focus-visible)");

        // Se não suportar, verifica se há polyfill (atributo [data-focus-visible-added])
        const hasPolyfill = node.hasAttribute("data-focus-visible-added");

        return supportsFocusVisible || hasPolyfill ? hasVisibleFocus : true;
      },
      metadata: {
        description:
          "Verifica estilos visíveis para :focus-visible em elementos focalizáveis.",
      },
    },
    //5.1.1
    {
      id: "check-video-presence",
      evaluate: function () {
        // Verifica elementos de vídeo nativo
        const videoElements = Array.from(
          document.querySelectorAll("video[src], video source[src]")
        );

        // Verifica elementos embed/object (Flash, players externos)
        const embedElements = Array.from(
          document.querySelectorAll('embed[src*=".swf"], object[data*=".swf"]')
        );

        // Verifica iframes com players de vídeo (YouTube, Vimeo, etc)
        const videoIframes = Array.from(
          document.querySelectorAll(
            'iframe[src*="youtube.com"], iframe[src*="vimeo.com"], iframe[src*="dailymotion.com"]'
          )
        );

        return (
          videoElements.length === 0 &&
          embedElements.length === 0 &&
          videoIframes.length === 0
        );
      },
      metadata: {
        description: "Verifica se a página contém elementos de vídeo.",
      },
    },
    //5.2.1
    {
      id: "check-audio-presence",
      evaluate: function () {
        // Verifica elementos de áudio nativo
        const audioElements = Array.from(
          document.querySelectorAll("audio[src], audio source[src]")
        );

        // Verifica elementos embed/object com arquivos de áudio
        const embedElements = Array.from(
          document.querySelectorAll(
            'embed[src*=".mp3"], embed[src*=".wav"], embed[src*=".ogg"], object[data*=".mp3"], object[data*=".wav"], object[data*=".ogg"]'
          )
        );

        // Verifica players de áudio comuns
        const audioPlayers = Array.from(
          document.querySelectorAll(
            'iframe[src*="soundcloud.com"], iframe[src*="spotify.com"], iframe[src*="anchor.fm"]'
          )
        );

        return (
          audioElements.length === 0 &&
          embedElements.length === 0 &&
          audioPlayers.length === 0
        );
      },
      metadata: {
        description: "Verifica se a página contém elementos de áudio.",
      },
    },
    //5.3.1
    {
      id: "check-video-content-presence",
      evaluate: function () {
        // Detecta vídeos HTML5
        const html5Videos = document.querySelectorAll(
          "video[src], video source[src]"
        );

        // Detecta elementos embed/object com vídeos
        const embedVideos = document.querySelectorAll(
          'embed[type^="video/"], object[type^="video/"]'
        );

        // Detecta iframes de serviços de vídeo (YouTube, Vimeo etc)
        const videoIframes = document.querySelectorAll(
          'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="vimeo.com"]'
        );

        // Verifica formatos comuns de vídeo
        const videoExtensions = [
          ".mp4",
          ".webm",
          ".ogg",
          ".mov",
          ".avi",
          ".swf",
        ];
        const mediaElements = document.querySelectorAll(
          "embed[src], object[data]"
        );
        const hasVideoFiles = Array.from(mediaElements).some((el) => {
          const src = el.getAttribute("src") || el.getAttribute("data") || "";
          return videoExtensions.some((ext) => src.includes(ext));
        });

        return (
          html5Videos.length === 0 &&
          embedVideos.length === 0 &&
          videoIframes.length === 0 &&
          !hasVideoFiles
        );
      },
      metadata: {
        description: "Verifica se existem elementos de vídeo na página.",
      },
    },
    //5.4.1
    {
      id: "check-audio-content-presence",
      evaluate: function () {
        // 1. Verifica elementos <audio> HTML5
        const html5Audio = document.querySelectorAll(
          "audio[src], audio source[src]"
        );

        // 2. Verifica elementos embed/object com arquivos de áudio
        const audioExtensions = [
          ".mp3",
          ".wav",
          ".ogg",
          ".aac",
          ".m4a",
          ".flac",
        ];
        const mediaElements = document.querySelectorAll(
          "embed[src], object[data]"
        );
        const hasAudioFiles = Array.from(mediaElements).some((el) => {
          const src = (
            el.getAttribute("src") ||
            el.getAttribute("data") ||
            ""
          ).toLowerCase();
          return audioExtensions.some((ext) => src.includes(ext));
        });

        // 3. Verifica players de áudio populares
        const audioPlayers = [
          "soundcloud.com",
          "spotify.com",
          "anchor.fm",
          "podcasts.google.com",
          "deezer.com",
          "tidal.com",
        ];
        const audioIframes = Array.from(
          document.querySelectorAll("iframe[src]")
        ).filter((iframe) => {
          const src = iframe.getAttribute("src") || "";
          return audioPlayers.some((domain) => src.includes(domain));
        });

        // 4. Verifica elementos com role="application" (players customizados)
        const customPlayers = document.querySelectorAll(
          '[role="application"][aria-label*="audio"], [role="application"][aria-label*="player"]'
        );

        return (
          html5Audio.length === 0 &&
          !hasAudioFiles &&
          audioIframes.length === 0 &&
          customPlayers.length === 0
        );
      },
      metadata: {
        description: "Verifica se existem elementos de áudio na página.",
      },
    },
    // 6.2.1
    {
      id: "check-input-label",
      evaluate: function (node) {
        // 1. Verifica se o input está dentro de uma tag <label>
        if (node.closest("label")) return true;

        // 2. Verifica se tem um <label> associado via for/id
        const id = node.getAttribute("id");
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }

        // 3. Verifica se tem aria-label ou aria-labelledby
        if (
          node.hasAttribute("aria-label") ||
          node.hasAttribute("aria-labelledby")
        ) {
          return true;
        }

        // 4. Verifica se tem title (como último recurso)
        if (
          node.hasAttribute("title") &&
          node.getAttribute("title").trim() !== ""
        ) {
          return true;
        }

        return false;
      },
      metadata: {
        description:
          "Verifica se elementos de formulário têm labels acessíveis.",
      },
    },
    //6.3.1
    {
      id: "check-form-tabindex",
      evaluate: function (node) {
        // Verifica se é um elemento de formulário
        if (node.tagName !== "FORM") return true;

        // Busca por elementos com tabindex dentro do formulário
        const elementsWithTabindex = node.querySelectorAll("[tabindex]");

        // Filtra apenas elementos que não são naturalmente focalizáveis
        const invalidElements = Array.from(elementsWithTabindex).filter(
          (el) => {
            const isNaturallyFocusable =
              (el.tagName === "A" && el.hasAttribute("href")) ||
              el.tagName === "BUTTON" ||
              el.tagName === "INPUT" ||
              el.tagName === "SELECT" ||
              el.tagName === "TEXTAREA" ||
              el.hasAttribute("contenteditable");

            // Considera válido apenas se for necessário sobrescrever ordem natural
            return (
              !isNaturallyFocusable && el.getAttribute("tabindex") !== "-1"
            );
          }
        );

        return invalidElements.length === 0;
      },
      metadata: {
        description: "Verifica uso apropriado de tabindex em formulários.",
      },
    },
    //6.4.1
    {
      id: "check-form-keyboard-events",
      evaluate: function (node) {
        const keyboardEvents = [
          "onchange",
          "onblur",
          "onfocus",
          "onformchange",
          "onforminput",
          "oninput",
          "oninvalid",
          "onreset",
          "onselect",
          "onsubmit",
          "onkeydown",
          "onkeypress",
          "onkeyup",
          "onclick",
        ];

        // Ignora inputs do tipo button, submit e reset
        const inputsToIgnore = ["button", "submit", "reset"];

        return !Array.from(node.elements).some((element) => {
          const isIgnoredInput =
            element.tagName === "INPUT" &&
            inputsToIgnore.includes(element.type);
          return (
            !isIgnoredInput &&
            keyboardEvents.some((evt) => element.hasAttribute(evt))
          );
        });
      },
      metadata: {
        description:
          "Verifica uso de eventos de teclado/foco em elementos de formulário.",
      },
    },
    //6.4.2
    {
      id: "check-form-mouse-events",
      evaluate: function (node) {
        const mouseEvents = [
          "ondblclick",
          "ondrag",
          "ondragend",
          "ondragenter",
          "ondragleave",
          "ondragover",
          "ondragstart",
          "ondrop",
          "onmousedown",
          "onmousemove",
          "onmouseout",
          "onmouseover",
          "onmouseup",
          "onmousewheel",
          "onscroll",
        ];

        // Verifica eventos inline nos elementos do formulário
        const formElements = node.elements || [];
        const hasInlineEvents = Array.from(formElements).some((element) => {
          return mouseEvents.some((evt) => element.hasAttribute(evt));
        });

        // Verifica seletores com atributos de eventos
        const hasEventAttributes = mouseEvents.some((evt) => {
          const eventName = evt.substring(2); // Remove 'on' do início
          return (
            node.querySelectorAll(`[${evt}], [data-${eventName}]`).length > 0
          );
        });

        return !(hasInlineEvents || hasEventAttributes);
      },
      metadata: {
        description:
          "Verifica uso de eventos de mouse/drag em elementos de formulário.",
      },
    },
    //6.7.1
    {
      id: "check-fieldset-grouping",
      evaluate: function (node) {
        // Ignora formulários sem campos relevantes
        const formControls = node.querySelectorAll(
          'input:not([type="hidden"]), textarea, select, button'
        );
        if (formControls.length < 2) return true;

        // Verifica se há fieldsets ou agrupamentos ARIA
        const hasFieldset = node.querySelector("fieldset") !== null;
        const hasAriaGroup =
          node.querySelector('[role="group"], [role="radiogroup"]') !== null;

        return hasFieldset || hasAriaGroup;
      },
      metadata: {
        description:
          "Verifica se formulários com múltiplos campos têm agrupamento lógico.",
      },
    },
    //6.7.2
    {
      id: "check-optgroup",
      evaluate: function (node) {
        // Verifica apenas selects com múltiplas opções relacionadas
        const selects = node.querySelectorAll("select");
        let requiresGrouping = false;

        selects.forEach((select) => {
          const options = select.querySelectorAll("option");
          if (options.length > 5) {
            // Heurística para selects complexos
            const hasOptgroup = select.querySelector("optgroup") !== null;
            const hasAriaGroup =
              select.hasAttribute("aria-owns") ||
              select.closest('[role="group"]');

            if (!hasOptgroup && !hasAriaGroup) {
              requiresGrouping = true;
            }
          }
        });

        return !requiresGrouping;
      },
      metadata: {
        description:
          "Verifica se selects complexos têm optgroup ou agrupamento ARIA.",
      },
    },
  ];

  const emagRules = [
    //6.7.2
    {
      id: "emag-optgroup",
      selector: "form",
      any: ["check-optgroup"],
      enabled: true,
      tags: ["emag", "form", "select", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 6.7.2 - Selects com muitas opções devem usar optgroup.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.7.2",
      },
    },
    //6.7.1
    {
      id: "emag-fieldset-grouping",
      selector: "form",
      any: ["check-fieldset-grouping"],
      enabled: true,
      tags: ["emag", "form", "grouping", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 6.7.1 - Formulários complexos devem usar fieldset para agrupamento.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.7.1",
      },
    },
    //6.4.2
    {
      id: "emag-form-mouse-events",
      selector: "form",
      any: ["check-form-mouse-events"],
      enabled: true,
      tags: ["emag", "form", "mouse", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 6.4.2 - Evitar eventos de mouse/drag exclusivos que prejudicam usuários de teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.4.2",
      },
    },
    //6.4.1
    {
      id: "emag-form-keyboard-events",
      selector: "form",
      any: ["check-form-keyboard-events"],
      enabled: true,
      tags: ["emag", "form", "keyboard", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 6.4.1 - Evitar eventos de teclado/foco que podem prejudicar a acessibilidade.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.4.1",
      },
    },
    // 6.3.1
    {
      id: "emag-form-tabindex",
      selector: "form",
      any: ["check-form-tabindex"],
      enabled: true,
      tags: ["emag", "form", "keyboard", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 6.3.1 - Evitar tabindex desnecessário em elementos de formulário.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.3.1",
        messages: {
          pass: "Formulário não contém tabindex desnecessários",
          fail: "Remova tabindex não-naturais dos elementos do formulário",
        },
      },
    },
    // 6.2.1
    {
      id: "emag-input-label",
      selector:
        "input:not([type='hidden']):not([type='submit']):not([type='reset']):not([type='button']):not([type='image']), textarea, select",
      any: ["check-input-label"],
      enabled: true,
      tags: ["emag", "form", "label", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 6.2.1 - Campos de formulário devem ter labels associados.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.2.1",
        messages: {
          pass: "Elemento tem um label associado",
          fail: "Adicione um label para este elemento de formulário",
        },
      },
    },
    //5.4.1
    {
      id: "emag-audio-content-presence",
      selector: "html",
      any: ["check-audio-content-presence"],
      enabled: true,
      tags: ["emag", "media", "audio", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 5.4.1 - Áudios devem ter transcrição textual alternativa.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.4.1",
        relatedNodes: function () {
          const nodes = [];
          // Captura todos os elementos de áudio relevantes
          document
            .querySelectorAll(
              'audio, embed, object, iframe, [role="application"]'
            )
            .forEach((el) => {
              if (
                el.tagName === "AUDIO" ||
                (el.src &&
                  audioExtensions.some((ext) => el.src.includes(ext))) ||
                el.getAttribute("role") === "application"
              ) {
                nodes.push({ html: el.outerHTML });
              }
            });
          return nodes;
        },
      },
    },
    //5.3.1
    {
      id: "emag-video-content-presence",
      selector: "html",
      any: ["check-video-content-presence"],
      enabled: true,
      tags: ["emag", "media", "video", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 5.3.1 - Vídeos devem ter recursos de acessibilidade.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.3.1",
        relatedNodes: function (node) {
          // Retorna todos os elementos de vídeo encontrados
          const videos = Array.from(
            document.querySelectorAll(
              'video, embed[type^="video/"], object[type^="video/"]'
            )
          );
          return videos.map((el) => ({ html: el.outerHTML }));
        },
      },
    },
    //5.2.1
    {
      id: "emag-audio-presence",
      selector: "html",
      any: ["check-audio-presence"],
      enabled: true,
      tags: ["emag", "media", "audio", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 5.2.1 - Páginas contendo áudio devem fornecer alternativas acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.2.1",
      },
    },
    //5.1.1
    {
      id: "emag-video-presence",
      selector: "html",
      any: ["check-video-presence"],
      enabled: true,
      tags: ["emag", "media", "video", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 5.1.1 - Páginas contendo vídeos devem fornecer alternativas acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.1.1",
      },
    },
    {
      id: "emag-focus-visible-explicit",
      selector:
        "a, button, input, select, textarea, [tabindex]:not([tabindex='-1']), [contenteditable='true']",
      any: ["check-focus-visible-styles"],
      enabled: true,
      tags: ["emag", "focus", "keyboard", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 4.4.1 - Elementos devem ter estilo visível com :focus-visible.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r4.4.1",
        techniques: ["C15", "G195"],
      },
    },
    // 4.4.1
    {
      id: "emag-focus-visible",
      selector:
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      any: ["check-focus-visible"],
      enabled: true,
      tags: ["emag", "focus", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 4.4.1 - Elementos focalizáveis devem ter estilo de foco visível.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r4.4.1",
      },
    },
    // 4.1.2
    {
      id: "emag-color-contrast",
      selector: "*",
      excludeHidden: true,
      any: ["check-color-contrast"],
      enabled: true,
      tags: ["emag", "color", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 4.1.2 - Contraste entre texto e fundo deve ser ≥4.5:1.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r4.1.2",
      },
    },
    // 3.12.1
    {
      id: "emag-abbr-title",
      selector: "abbr, acronym",
      any: ["check-abbr-title"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.12.1 - Siglas devem ter atributo title explicativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.12.1",
      },
    },
    // 3.11.3
    {
      id: "emag-justified-css",
      selector: "p",
      any: ["check-justified-css"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.11.3 - Evitar text-align: justify em parágrafos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.11.3",
      },
    },
    // 3.11.2
    {
      id: "emag-justified-align-attribute",
      selector: "p[align]",
      any: ["check-justified-align-attribute"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.11.2 - Evitar parágrafos com align='justify'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.11.2",
      },
    },
    // 3.10.1
    {
      id: "emag-table-cell-association",
      selector: "table",
      any: ["check-table-cell-association"],
      enabled: true,
      tags: ["emag", "table", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.10.1 - Tabelas devem ter células associadas via headers, scope ou estrutura semântica.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.10.1",
      },
    },
    // 3.9.1
    {
      id: "emag-table-caption-summary",
      selector: "table",
      any: ["check-table-caption-summary"],
      enabled: true,
      tags: ["emag", "table", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 3.9.1 - Tabelas de dados devem ter caption ou summary.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.9.1",
      },
    },
    // 3.7.1
    {
      id: "emag-image-map-alt",
      selector: "img[usemap], area[href]",
      any: ["check-image-map-alt"],
      enabled: true,
      tags: ["emag", "image", "map", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.7.1 - Mapas de imagem devem ter descrição alternativa.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.7.1",
      },
    },
    //3.6.8
    {
      id: "emag-img-duplicate-alt-title",
      selector: "img[alt][title]",
      any: ["check-img-duplicate-alt-title"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.6.8 - Evitar alt e title com o mesmo conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.8",
      },
    },
    //3.6.7
    {
      id: "emag-img-same-alt-different-src",
      selector: "img[alt][src]",
      any: ["check-img-same-alt-different-src"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 3.6.7 - Imagens diferentes não devem ter a mesma descrição.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.7",
      },
    },
    // 3.6.4
    {
      id: "emag-img-generic-alt",
      selector: "img[alt]",
      any: ["check-img-generic-alt"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.6.4 - Evitar descrições genéricas no atributo alt.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.4",
      },
    },
    // 3.6.3
    {
      id: "emag-img-alt-filename",
      selector: "img[src][alt]",
      any: ["check-img-alt-filename"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.6.3 - Evitar usar nome do arquivo como texto alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.3",
      },
    },
    //3.6.2
    {
      id: "emag-img-alt",
      selector: "img:not([role='presentation']):not([aria-hidden='true'])",
      any: ["check-img-alt"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.6.2 - Imagens informativas devem ter atributo alt descritivo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.2",
      },
    },
    // 3.5.15
    {
      id: "emag-malformed-urls",
      selector: "a[href]",
      any: ["check-malformed-urls"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 3.5.15 - Evitar URLs mal formatadas ou protocolos inseguros.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.14
    {
      id: "emag-broken-links",
      selector: "a[href]",
      any: ["check-broken-links"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.5.14 - Evitar links quebrados (404, 503, etc).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.13
    {
      id: "emag-long-link-text",
      selector: "a[href]",
      any: ["check-long-link-text"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 3.5.13 - Evitar textos de link muito longos (>2000 chars).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.12
    {
      id: "emag-duplicate-title-text",
      selector: "a[href][title]",
      any: ["check-duplicate-title-text"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.5.12 - Evitar title igual ao texto do link.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.11
    {
      id: "emag-same-text-different-href",
      selector: "a[href]", // Alterado para selector
      any: ["check-same-text-different-href"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        help: "EMAG 3.1 3.5.11 - Evitar links com mesmo texto para destinos diferentes.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.10
    {
      id: "emag-duplicate-href-different-text",
      selector: "a[href]", // Alterado para selector
      any: ["check-duplicate-href-different-text"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "moderate",
      metadata: {
        help: "EMAG 3.1 3.5.10 - Evitar links com mesmo destino e textos diferentes.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.6
    {
      id: "emag-generic-link-text",
      selector: "a[href]",
      any: ["check-generic-link-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        description: "Links devem ter textos descritivos e não genéricos.",
        help: "EMAG 3.1 3.5.6 - Evitar textos de link genéricos como 'clique aqui'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.5
    {
      id: "emag-image-link-alt",
      selector: "a[href]",
      any: ["check-image-link-alt"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "image", "acessibilidade"],
      impact: "critical",
      metadata: {
        description: "Links com imagens devem ter texto alternativo.",
        help: "EMAG 3.1 3.5.5 - Imagens dentro de links devem ter atributo alt descritivo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.4
    {
      id: "emag-title-only-link",
      selector: "a[href][title]",
      any: ["check-title-only-link"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        description: "Links não devem depender apenas do atributo title.",
        help: "EMAG 3.1 3.5.4 - Evitar links que usam apenas title como descrição.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.3
    {
      id: "emag-empty-link",
      selector: "a[href]",
      any: ["check-empty-link"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "critical",
      metadata: {
        description: "Links não devem estar vazios.",
        help: "EMAG 3.1 3.5.3 - Evitar links sem texto descritivo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.2
    {
      id: "emag-link-url-text",
      selector: "a[href]",
      any: ["check-link-url-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "moderate",
      metadata: {
        description: "Links não devem ter URLs como texto descritivo.",
        help: "EMAG 3.1 3.5.2 - Evitar links com texto descritivo em formato de URL.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.3
    {
      id: "emag-descriptive-title",
      selector: "html",
      any: ["check-descriptive-title"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "acessibilidade", "head"],
      impact: "moderate",
      metadata: {
        description: "Verifica se o título da página existe.",
        help: "EMAG 3.1 3.3 - O título da página deve existir.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.3",
      },
    },
    {
      id: "emag-page-title",
      selector: "html", // Aplica ao documento inteiro
      any: ["check-page-title"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "acessibilidade", "head"],
      impact: "critical",
      metadata: {
        description:
          "Verifica se a página possui um título descritivo e informativo.",
        help: "EMAG 3.1 3.3.1 - A página deve ter um título não vazio na tag <title>.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.3.1",
      },
    },
    // 3.2.1
    {
      id: "emag-element-lang",
      selector: "*:not(html):not([lang])", // Todos elementos exceto html, ou com atributo lang explícito
      any: ["check-visible-text-lang"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "acessibilidade", "i18n"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se elementos com conteúdo em idioma diferente do principal estão identificados com o atributo lang.",
        help: "EMAG 3.1 3.2.1 - Elementos com conteúdo em idioma diferente do principal devem ter atributo lang.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.2",
      },
    },
    // 3.1.1
    {
      id: "emag-lang-attribute",
      selector: "html",
      any: ["check-html-lang"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "idioma"],
      impact: "critical",
      metadata: {
        description:
          "Identificação do idioma principal da página por meio do atributo lang ou xml:lang conforme o doctype.",
        help: "EMAG 3.1.1 - Informar o idioma principal da página com o atributo lang (HTML) ou xml:lang (XHTML).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.1",
      },
    },
    // 2.6.1
    {
      id: "emag-no-blink",
      selector: "body",
      any: ["check-blink-element"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "parpadeo", "acessibilidade"],
      impact: "serious",
      metadata: {
        description: "Verifica a presença do elemento <blink> na página.",
        help: "EMAG 3.1 R2.6.1 - O uso do elemento <blink> deve ser evitado por causar distração e desconforto a usuários.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.6",
      },
    },
    // 2.6.2
    {
      id: "emag-no-marquee",
      selector: "body",
      any: ["check-marquee-element"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "marquee", "acessibilidade"],
      impact: "serious",
      metadata: {
        description: "Verifica a presença do elemento <marquee> na página.",
        help: "EMAG 3.1 R2.6.2 - O uso do elemento <marquee> deve ser evitado por causar desconforto visual e problemas de acessibilidade.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.6",
      },
    },
    // 2.6.3
    {
      id: "emag-no-animated-gif",
      selector: "body",
      any: ["check-animated-gif"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "imagem", "gif", "acessibilidade"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica a presença de imagens GIF com intermitência ou movimentação na tela.",
        help: "EMAG 3.1 R2.6.3 - Imagens em movimento, como GIFs animados, podem gerar desconforto, epilepsia ou dificuldades para usuários sensíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.6",
      },
    },
    // 2.4.1
    {
      id: "emag-auto-redirect",
      selector: "body",
      any: ["check-auto-redirect"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "redirecionamento"],
      impact: "serious",
      metadata: {
        description: "Verifica se a página possui redirecionamento automático.",
        help: "EMAG 3.1 R2.4.1 - Evitar redirecionamentos automáticos, pois podem prejudicar usuários de tecnologias assistivas.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.4",
      },
    },
    // 2.3.1
    {
      id: "emag-auto-refresh",
      selector: "body",
      any: ["check-auto-refresh"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "tempo"],
      impact: "moderate",
      metadata: {
        description: "Verifica se a página possui atualização automática.",
        help: "EMAG 3.1 R2.3.1 - Evitar atualizações automáticas que prejudiquem a navegação dos usuários.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.3",
      },
    },
    // 2.2.4
    {
      id: "emag-applet-has-text",
      selector: "body",
      any: ["check-applet-has-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se os elementos <applet> possuem conteúdo alternativo textual.",
        help: "EMAG 3.1 R2.2.4 - Elementos <applet> devem fornecer conteúdo alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.2.3
    {
      id: "emag-embed-has-text",
      selector: "body",
      any: ["check-embed-has-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se os elementos <embed> possuem conteúdo alternativo textual.",
        help: "EMAG 3.1 R2.2.3 - Elementos <embed> devem fornecer conteúdo alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.2.2
    {
      id: "emag-object-has-text",
      selector: "body",
      any: ["check-object-has-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se os elementos <object> possuem conteúdo alternativo textual.",
        help: "EMAG 3.1 R2.2.2 - Elementos <object> devem fornecer conteúdo alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.2.1
    {
      id: "emag-noscript-with-script",
      selector: "body",
      any: ["check-noscript-with-script"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se há elemento <script> sem um <noscript> como alternativa.",
        help: "EMAG 3.1 R2.2.1 - Páginas que usam scripts devem fornecer alternativas com <noscript>.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.1.8
    {
      id: "emag-event-on-non-interactive",
      selector: "body",
      any: ["check-event-on-non-interactive"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "interaction"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se há eventos aplicados a elementos não interativos, o que prejudica a acessibilidade.",
        help: "EMAG 3.1 R2.1.8 - Eventos devem ser aplicados apenas a elementos interativos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      },
    },
    //2.1.6
    {
      id: "emag-dblclick-event",
      selector: "body",
      any: ["check-dblclick-event"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "interaction"],
      impact: "moderate",
      metadata: {
        description:
          "Garante que não haja uso do evento ondblclick, que não é acessível para teclado.",
        help: "EMAG 3.1 R2.1.6 - Evite o uso de eventos ondblclick que não possuem equivalência natural no teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      },
    },

    // 2.1.2
    {
      id: "emag-mouse-only-events",
      selector: "body",
      any: ["check-mouse-only-events"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "interaction"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se há funcionalidades disponíveis apenas pelo mouse, sem equivalentes para teclado.",
        help: "EMAG 3.1 R2.1.2 - Toda funcionalidade deve estar disponível pelo teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      },
    },
    // 1.9.1
    {
      id: "emag-link-target-blank",
      selector: "body",
      any: ["check-link-target-blank"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "link"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se há links que abrem em nova aba ou janela utilizando target='_blank'.",
        help: "EMAG 3.1 R1.9.1 - Informar aos usuários quando um link abre em nova aba ou janela utilizando target='_blank'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.9",
      },
    },
    //1.8.3
    {
      id: "emag-semantic-landmarks-exist",
      selector: "body",
      any: ["check-semantic-landmarks-exist"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "semantics"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se há ausência de landmarks semânticas HTML5 como header, footer, section, aside, nav ou article.",
        help: "EMAG 3.1 R1.8.3 - Utilize landmarks semânticas (header, footer, section, aside, nav, article) para estruturar o conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.8",
      },
    },
    //1.1
    {
      id: "emag-html-validation",
      selector: "html",
      any: ["emag-html-validation-check"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "validação"],
      impact: "moderate",
      metadata: {
        description: "Validação do HTML via W3C Validator",
        help: "EMAG 3.1 R1.1 - Presença de erros de marcação HTML.",
        helpUrl: "https://validator.w3.org/",
      },
    },

    // 1.7.1
    {
      id: "emag-adjacent-links-without-separation",
      selector: "body",
      any: ["check-adjacent-links-without-separation"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "link"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se há links adjacentes sem separação textual ou por elementos.",
        help: "EMAG 3.1 R1.7.1 - Links adjacentes devem ter separação, seja por texto (ex: ' | ' ou ' / ') ou por elementos (ex: <span>, <li>).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.7",
      },
    },
    // 1.6.2
    {
      id: "emag-form-inside-table",
      selector: "body",
      any: ["check-form-inside-table"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "form", "table"],
      impact: "serious",
      metadata: {
        description: "Verifica se há formulário dentro de uma tabela.",
        help: "EMAG 3.1 R1.6.2 - Não utilize formulário dentro de tabela. Isso prejudica a acessibilidade e a leitura dos elementos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.6",
      },
    },
    // 1.6.1
    {
      id: "emag-table-exists",
      selector: "body",
      any: ["check-table-exists"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "table"],
      impact: "moderate",
      metadata: {
        description: "Verifica se existem tabelas na página.",
        help: "EMAG 3.1 R1.6.1 - Foram utilizadas tabelas na página. Evite usar tabelas para layout, use apenas para dados tabulares.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.6",
      },
    },
    // 3.6.1
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
    // 1.5 tem que revisar isso ai talvez precise separar como as outras
    {
      id: "emag-ancoras-bloco",
      selector: "body",
      any: [
        "ancora-para-bloco",
        "primeiro-link-para-conteudo",
        "check-anchor-skip-links-presence",
      ],
      all: ["accesskey-unico", "check-anchor-skip-links-target"],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "moderate",
      metadata: {
        description:
          "Deve haver âncoras acessíveis no início da página que permitam pular para blocos de conteúdo como menu, conteúdo principal e busca. É importante ressaltar que o primeiro link da página deve ser o de ir para o conteúdo.",
        help: "EMAG 3.1 R1.5 - Âncoras acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    // 1.1.3
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
    // 1.1.4
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
    // 1.1.5
    {
      id: "js-inline",
      selector:
        "[onload], [onunload], [onblur], [onchange], [onfocus], [onsearch], [onselect], [onsubmit], [onkeydown], [onkeypress], [onkeyup], [onclick], [ondblclick], [onmousedown], [onmousemove], [onmouseout], [onmouseover], [onmouseup], [onmousewheel], [oncopy], [oncut], [onpaste], [onabort]",
      any: ["js-inline-check"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "padrões", "html", "javascript"],
      impact: "minor",
      metadata: {
        description:
          "Evitar o uso de JavaScript inline em atributos de evento. Utilize arquivos JavaScript externos.",
        help: "EMAG 3.1 R1.1.5 - Presença de javascript(s) in-line.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.1",
      },
    },
    // 1.1.6
    {
      id: "js-internal",
      selector: "script",
      any: ["js-internal-check"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "padrões", "html", "javascript"],
      impact: "minor",
      metadata: {
        description:
          "Evitar o uso de JavaScript interno. Utilize arquivos JavaScript externos sempre que possível.",
        help: "EMAG 3.1 R1.1.6 - Presença de javascript(s) interno.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.1",
      },
    },
    //1.3.1
    {
      id: "emag-has-heading",
      selector: "html",
      any: ["check-has-heading"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "heading"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se a página contém pelo menos um cabeçalho (<h1> até <h6>), conforme o eMAG 3.1 R1.3.1.",
        help: "EMAG 3.1 R1.3.1 - Presença de javascript(s) in-line. Inclua pelo menos um cabeçalho (<h1> até <h6>) na página.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.3",
      },
    },
    // 1.3.2
    {
      id: "emag-heading-hierarchy",
      selector: "body",
      any: ["check-heading-hierarchy"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "heading"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se a hierarquia dos cabeçalhos está correta (não há pulos de nível).",
        help: "EMAG 3.1 R1.3.2 Use cabeçalhos de forma sequencial, sem pular níveis (ex.: <h2> só depois de <h1>).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.3",
      },
    },
    // 1.3.4
    {
      id: "emag-only-h1",
      selector: "body",
      any: ["check-only-h1"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "heading"],
      impact: "moderate",
      metadata: {
        description:
          "Verifica se foi usado apenas <h1> sem outros níveis de cabeçalho.",
        help: "EMAG 3.1 R1.3.4 Utilize outros níveis de cabeçalho além do <h1> para categorizar os conteúdos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.3",
      },
    },
    // 1.3.6
    {
      id: "emag-multiple-h1",
      selector: "body",
      any: ["check-multiple-h1"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "heading"],
      impact: "serious",
      metadata: {
        description: "Verifica se há mais de um <h1> na página.",
        help: "EMAG 3.1 R1.3.6 Use apenas um <h1> para definir o título principal da página, existe mais de um (1) <h1> na página.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.3",
      },
    },
    // 1.4.1
    {
      id: "emag-content-before-menu",
      selector: "body",
      any: ["check-content-before-menu"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "order", "structure"],
      impact: "minor",
      metadata: {
        description: "Verifica se o conteúdo está antes do menu no HTML.",
        help: "EMAG 3.1 R1.4.1 O bloco de conteúdo deve estar antes do menu no código HTML para garantir a ordem lógica de leitura.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.4",
      },
    },
    // 1.4.3
    {
      id: "emag-tabindex-presence",
      selector: "body",
      any: ["check-tabindex-presence"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "tabindex", "order"],
      impact: "minor",
      metadata: {
        description: "Verifica se há uso do atributo tabindex.",
        help: "EMAG 3.1 R1.4.3 O uso do atributo tabindex deve ser evitado, pois pode interferir na ordem natural de navegação.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.4",
      },
    },

    // 1.4.6
    {
      id: "emag-tabindex-range",
      selector: "body",
      any: ["check-tabindex-range"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "tabindex", "order"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se há tabindex fora do intervalo permitido (-1 ou 0 até 32767).",
        help: "EMAG 3.1 R1.4.6 O atributo tabindex não deve possuir valores menores que -1 ou maiores que 32767.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.4",
      },
    },
  ];

  axe.configure({
    branding: { applicaton: "eMAG Validator" },
    standards: { emag: "3.1" },
    checks: emagChecks,
    rules: emagRules,
  });
})();
