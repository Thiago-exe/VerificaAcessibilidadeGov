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
        description: "Garante que existam âncoras que permitam saltar entre seções da página.",
      }
    },
    // 1.5.2
    {
      id: "check-anchor-skip-links-target",
      evaluate: function (node) {
        const anchors = Array.from(node.querySelectorAll('a[href^="#"]'));
        const ids = new Set(Array.from(node.querySelectorAll('[id]')).map(el => el.id));
    
        return anchors.every(anchor => {
          const href = anchor.getAttribute('href').slice(1); // Remove o #
          return href.length === 0 || ids.has(href);
        });
      },
      metadata: {
        description: "Garante que todas as âncoras de salto tenham um destino correspondente na página.",
      }
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
      }
    },
    // 1.4.1
    {
      id: "check-content-before-menu",
      evaluate: function (node) {
        const contentSelectors = ['main', '#content', '#wrapper', '[role="main"]'];
        const menuSelectors = ['nav', '#menu', '[role="navigation"]'];
    
        const content = node.querySelector(contentSelectors.join(','));
        const menu = node.querySelector(menuSelectors.join(','));
    
        if (!content || !menu) {
          return true; // Se não existe um dos dois, não se aplica
        }
    
        const position = content.compareDocumentPosition(menu);
    
        return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      }
    },
    // 1.4.3
    {
      id: "check-tabindex-presence",
      evaluate: function (node) {
        return node.querySelectorAll('[tabindex]').length === 0;
      },
      metadata: {
        description: "Garante que não há uso do atributo tabindex na página.",
      }, metadata: {
        description: "Garante que o bloco de conteúdo vem antes do menu no HTML.",
      }
    },
    // 1.4.6
    {
      id: "check-tabindex-range",
      evaluate: function (node) {
        const elements = Array.from(node.querySelectorAll('[tabindex]'));
    
        return elements.every(el => {
          const tabindex = parseInt(el.getAttribute('tabindex'), 10);
          return tabindex === -1 || (tabindex >= 0 && tabindex <= 32767);
        });
      },
      metadata: {
        description: "Garante que os valores de tabindex estão no intervalo permitido (-1 ou 0 a 32767).",
      }
    },
    // 1.6.1
    {
      id: "check-table-exists",
      evaluate: function (node) {
        return node.querySelectorAll("table").length > 0;
      },
      metadata: {
        description: "Verifica se existe uma tabela na página pra avisar.",
      }
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
      }
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
              const hasSeparator = between.some(node => {
                return (
                  (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") ||
                  (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== "a")
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
        description: "Verifica se há links adjacentes sem separação textual ou por elementos.",
      }
    },
    //1.8.1
    {
      id: "check-semantic-landmarks-missing",
      evaluate: function (node) {
        const landmarks = ["header", "footer", "section", "aside", "nav", "article"];
        return !landmarks.some(tag => node.querySelector(tag));
      },
      metadata: {
        description: "Garante que há ausência total de landmarks semânticas (header, footer, section, aside, nav, article).",
      }
    },
    {
      id: "check-link-target-blank",
      evaluate: function (node) {
        const links = node.querySelectorAll('a[target="_blank"]');
        return links.length > 0;
      },
      metadata: {
        description: "Verifica se há links com target='_blank', que abrem em nova aba ou janela.",
      }
    },
    // 2.1.2
    {
      id: "check-mouse-only-events",
      evaluate: function (node) {
        const mouseEvents = ["onmousedown", "onmouseup", "onmouseover", "onmouseout"];
        const keyboardEvents = ["onkeydown", "onkeyup", "onkeypress", "onfocus", "onblur"];
    
        const elements = node.querySelectorAll("*");
        let hasMouseEventWithoutKeyboard = false;
    
        elements.forEach(el => {
          const hasMouse = mouseEvents.some(ev => el.hasAttribute(ev));
          const hasKeyboard = keyboardEvents.some(ev => el.hasAttribute(ev));
          if (hasMouse && !hasKeyboard) {
            hasMouseEventWithoutKeyboard = true;
          }
        });
    
        return !hasMouseEventWithoutKeyboard;
      },
      metadata: {
        description: "Garante que funcionalidades controladas por mouse também estejam disponíveis por teclado.",
      }
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
      }
    },
    //2.1.8
    {
      id: "check-event-on-non-interactive",
      evaluate: function (node) {
        const interactiveTags = [
          "a", "button", "input", "textarea", "select", "label", "option", "details", "summary"
        ];
    
        const eventAttributes = [
          "onclick", "ondblclick", "onmousedown", "onmouseup", "onmouseover", "onmouseout",
          "onkeydown", "onkeyup", "onkeypress", "onfocus", "onblur", "onchange"
        ];
    
        const elements = node.querySelectorAll("*");
        let hasInvalidEvent = false;
    
        elements.forEach(el => {
          const tagName = el.tagName.toLowerCase();
          const isInteractive = interactiveTags.includes(tagName);
    
          const hasEvent = eventAttributes.some(ev => el.hasAttribute(ev));
    
          if (!isInteractive && hasEvent) {
            hasInvalidEvent = true;
          }
        });
    
        return !hasInvalidEvent;
      },
      metadata: {
        description: "Garante que eventos não estejam aplicados a elementos não interativos.",
      }
    }
    
    
    
    
  ];

  const emagRules = [
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
        description: "Verifica se há eventos aplicados a elementos não interativos, o que prejudica a acessibilidade.",
        help: "EMAG 3.1 R2.1.8 - Eventos devem ser aplicados apenas a elementos interativos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      }
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
        description: "Garante que não haja uso do evento ondblclick, que não é acessível para teclado.",
        help: "EMAG 3.1 R2.1.6 - Evite o uso de eventos ondblclick que não possuem equivalência natural no teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      }
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
        description: "Verifica se há funcionalidades disponíveis apenas pelo mouse, sem equivalentes para teclado.",
        help: "EMAG 3.1 R2.1.2 - Toda funcionalidade deve estar disponível pelo teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      }
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
        description: "Verifica se há links que abrem em nova aba ou janela utilizando target='_blank'.",
        help: "EMAG 3.1 R1.9.1 - Informar aos usuários quando um link abre em nova aba ou janela utilizando target='_blank'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.9",
      }
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
        description: "Verifica se há ausência de landmarks semânticas HTML5 como header, footer, section, aside, nav ou article.",
        help: "EMAG 3.1 R1.8.3 - Utilize landmarks semânticas (header, footer, section, aside, nav, article) para estruturar o conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.8",
      }
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
        description: "Verifica se há links adjacentes sem separação textual ou por elementos.",
        help: "EMAG 3.1 R1.7.1 - Links adjacentes devem ter separação, seja por texto (ex: ' | ' ou ' / ') ou por elementos (ex: <span>, <li>).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.7",
      }
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
      }
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
      }
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
      }
    },
    // 1.5 tem que revisar isso ai talvez precise separar como as outras
    {
      id: "emag-ancoras-bloco",
      selector: "body",
      any: ["ancora-para-bloco", "primeiro-link-para-conteudo", "check-anchor-skip-links-presence"],
    all: ["accesskey-unico","check-anchor-skip-links-target"],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "moderate",
      metadata: {
        description:
          "Deve haver âncoras acessíveis no início da página que permitam pular para blocos de conteúdo como menu, conteúdo principal e busca. É importante ressaltar que o primeiro link da página deve ser o de ir para o conteúdo.",
        help: "EMAG 3.1 R1.5 - Âncoras acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
        description: "Verifica se há tabindex fora do intervalo permitido (-1 ou 0 até 32767).",
        help: "EMAG 3.1 R1.4.6 O atributo tabindex não deve possuir valores menores que -1 ou maiores que 32767.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.4",
      }
    }
  ];

  axe.configure({
    checks: emagChecks,
    rules: emagRules,
  });
})();
