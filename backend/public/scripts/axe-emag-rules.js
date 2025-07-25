// INICIO DOS CHECKS (TESTES)
(() => {
  const emagChecks = [
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
      metadata: {
        description:
          "Garanta que links âncora para elementos na página apontem para alvos existentes e visíveis.",
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
          "Inclua links de pulo (âncoras) no início da página para permitir que usuários avancem direto ao conteúdo principal.",
      },
    },

    // 1.2.3
    {
      id: "check-no-text-content",
      evaluate: function (node) {
        // Garante que o 'evaluate' só rode em elementos que tenham os métodos necessários.
        if (!node || typeof node.getAttribute !== "function") {
          return true;
        }

        // 1. PASSOU se tiver conteúdo de texto.
        if ((node.textContent || "").trim() !== "") {
          return true;
        }

        // 2. PASSOU se tiver um nome acessível via ARIA ou pelo atributo 'title'.
        // A verificação do 'title' foi consolidada aqui.
        if (
          (node.getAttribute("aria-label") || "").trim() !== "" ||
          (node.getAttribute("aria-labelledby") || "").trim() !== "" ||
          (node.getAttribute("title") || "").trim() !== ""
        ) {
          return true;
        }

        // 3. PASSOU se contiver uma imagem com texto alternativo.
        if (typeof node.querySelector === "function") {
          const meaningfulImage = node.querySelector('img[alt]:not([alt=""])');
          if (meaningfulImage) {
            return true;
          }
        }

        // 4. FALHOU se nenhuma das verificações acima passou.
        return false;
      },
      metadata: {
        description:
          "Garanta que o elemento tenha texto visível ou nome acessível via ARIA, title ou imagem com alt descritivo.",
      },
    },
    // 1.5.2
    {
      id: "check-anchor-target-exists",
      evaluate: function (node) {
        // 'node' aqui é a própria tag <a> que estamos testando.
        const href = node.getAttribute("href");

        // Ignoramos links como <a href="#">, que não apontam para um ID.
        if (!href || href === "#" || href.length < 2) {
          return true; // PASSA (não é um link para uma âncora específica)
        }

        // Extrai o ID do href (ex: de "#conteudo", pega "conteudo")
        const targetId = href.substring(1);

        // Tenta encontrar o elemento na página com aquele ID.
        const targetElement = document.getElementById(targetId);

        // O teste PASSA se o elemento de destino for encontrado.
        // O teste FALHA se getElementById retornar null.
        return targetElement !== null;
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
      metadata: {
        description:
          "Inclua como primeiro link visível da página uma âncora que leve diretamente ao conteúdo principal, como uma seção com id 'conteudo' ou 'main'.",
      },
    },
    // verificando css-inline
    {
      id: "css-inline-check",
      evaluate: function (node) {
        // Se existe atributo style, retorna true
        return !node.hasAttribute("style");
      },
      metadata: {
        description:
          "Evite o uso de estilos inline; utilize folhas de estilo externas ou internas para manter a separação entre conteúdo e apresentação.",
      },
    },
    // Validar css interno
    {
      id: "fail-if-exists",
      evaluate: function (node) {
        return false; // Sempre falha, pois o seletor já encontrou a violação.
      },
      metadata: {
        description: "Evite essa má prática, agarre-se às recomendações.",
      },
    },
    {
      id: "css-internal-check",
      evaluate: function (node) {
        return !(node.tagName.toLowerCase() === "style");
      },
      metadata: {
        description:
          "Evite o uso de CSS interno na tag <style>; prefira folhas de estilo externas para melhor organização e reutilização.",
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

        return !eventAttributes.some((attr) => node.hasAttribute(attr));
      },
      metadata: {
        description:
          "Evite o uso de manipuladores de evento inline como onclick e onload; use JavaScript externo ou adicionados via addEventListener.",
      },
    },
    // Presença de JavaScript interno
    {
      id: "js-internal-check",
      evaluate: function (node) {
        return !(node.tagName.toLowerCase() === "script");
      },
      metadata: {
        description:
          "Evite scripts internos na página; usar JavaScript externo melhora a organização e permite melhor controle, prevenindo possíveis bloqueios que prejudicam leitores de tela e tecnologias assistivas.",
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
        description:
          "Inclua pelo menos um elemento de cabeçalho (h1 a h6) na página para estruturar o conteúdo e melhorar a acessibilidade.",
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
          "Mantenha a hierarquia sequencial correta dos cabeçalhos (h1, h2, h3...) sem pular níveis para melhorar a estrutura semântica.",
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
          "Use outros níveis de cabeçalho além do <h1> para criar uma estrutura hierárquica adequada no conteúdo.",
      },
    },
    // 1.3.6
    {
      id: "check-multiple-h1",
      evaluate: function (node) {
        // Altere o seletor para garantir que estamos buscando em todo o documento composto
        // Se a página tem iframes, o Axe-core já deve estar rodando a regra neles
        // O `node` aqui será o `document.body` ou o `document.body` do iframe.
        const allH1s = Array.from(node.querySelectorAll("h1"));

        // DEBUG: Adicione logs para ver o que está sendo encontrado
        console.log(
          `[DEBUG check-multiple-h1] Node: ${node.nodeName}, ID: ${node.id}`
        );
        console.log(
          `[DEBUG check-multiple-h1] Total h1s encontrados no contexto atual: ${allH1s.length}`
        );

        allH1s.forEach((h1, index) => {
          console.log(
            `[DEBUG check-multiple-h1] h1[${index}]: ${h1.outerHTML}`
          );
        });

        return allH1s.length <= 1;
      },
      metadata: {
        description:
          "Use no máximo um elemento <h1> por página para manter clareza e acessibilidade na estrutura do conteúdo.",
      },
    },
    // 1.4.1 VERIFICAR TESTAR
    // Adicione este novo objeto ao seu array `emagChecks`
    {
      id: "check-menu-is-after-content",
      evaluate: function (node) {
        // 'node' aqui será o elemento do menu
        const contentSelectors = 'main, #content, #main, [role="main"]';
        const content = document.querySelector(contentSelectors);

        // Se a página não tiver uma área de conteúdo principal, a regra não se aplica.
        if (!content) {
          return true;
        }

        // Verifica se o elemento de conteúdo aparece ANTES do menu atual ('node')
        const contentIsFirst = !!(
          content.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_FOLLOWING
        );

        // Se o conteúdo NÃO vier primeiro, encontramos uma violação.
        if (!contentIsFirst) {
          // Adiciona dados para um relatório mais rico, mostrando os dois elementos envolvidos
          this.data({
            contentSelector: axe.utils.getSelector(content),
            menuSelector: axe.utils.getSelector(node),
          });
          return false; // FALHA
        }

        // Se o conteúdo vem primeiro, a ordem está correta.
        return true; // PASSA
      },
      metadata: {
        description:
          "Posicione o menu de navegação após o conteúdo principal no DOM para melhorar a ordem lógica e a experiência de navegação por leitores de tela.",
      },
    },
    // 1.4.3 CHECK
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
          "Evite o uso do atributo tabindex para não interferir na ordem natural de navegação pelo teclado.",
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
          "Use apenas valores de tabindex entre -1 e 32767 para manter a navegação pelo teclado acessível e previsível.",
      },
    },
    // 1.6.1 TESTAR
    {
      id: "emag-table-presence",
      evaluate: function (node, options, virtualNode) {
        // Versão simplificada que não depende do context
        const tables = node.querySelectorAll("table");

        if (tables.length === 0) {
          return true; // Passa se não houver tabelas
        }

        // Armazena os seletores diretamente no nó
        return {
          result: false,
          data: {
            tables: Array.from(tables).map((table) => ({
              selector: axe.utils.getSelector(table),
              html:
                table.outerHTML.substring(0, 100) +
                (table.outerHTML.length > 100 ? "..." : ""),
            })),
          },
        };
      },
      metadata: {
        description:
          "Verifique se todas as tabelas estão corretamente marcadas semanticamente conforme o EMAG para garantir acessibilidade.",
        help: "EMAG 1.6.1 - Tabelas devem ser marcadas corretamente",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.6.1",
        messages: {
          pass: "Nenhuma tabela encontrada na página.",
          fail: "Tabela(s) encontrada(s) - verifique marcação semântica",
        },
      },
    },
    //1.6.2 TESTAR
    {
      id: "check-form-inside-table",
      evaluate: function (node) {
        const results = [];
        const tables = node.querySelectorAll("table");

        for (const table of tables) {
          const forms = table.querySelectorAll("form");
          for (const form of forms) {
            results.push(form); // aponta o <form> diretamente
          }
        }

        return results.length > 0 ? results : false;
      },
      metadata: {
        description:
          "Evite colocar formulários dentro de tabelas, pois essa prática prejudica a estrutura semântica e a acessibilidade do HTML.",
      },
    },
    // 1.7.1
    {
      id: "check-if-next-is-unseparated-link",
      evaluate: function (node) {
        // 'node' é o link atual que estamos verificando
        const nextEl = node.nextElementSibling;

        // Se o próximo elemento irmão não existir ou não for um link, esta regra não se aplica a ESTE link.
        if (!nextEl || nextEl.tagName !== "A" || !nextEl.hasAttribute("href")) {
          return true; // PASSA
        }

        // Se o próximo irmão é um link, verificamos o que há entre eles.
        let sibling = node.nextSibling;
        while (sibling && sibling !== nextEl) {
          // Se encontrarmos um nó de texto com conteúdo, é um separador.
          if (sibling.nodeType === 3 && sibling.textContent.trim() !== "") {
            return true; // PASSOU, encontrou separador de texto
          }
          // Se encontrarmos qualquer outro elemento (ex: <br>, <span>), também é um separador.
          if (sibling.nodeType === 1) {
            return true; // PASSOU, encontrou elemento separador
          }
          sibling = sibling.nextSibling;
        }

        // Se o loop terminar sem encontrar um separador, é uma violação.
        // Adicionamos o segundo link ao relatório para dar mais contexto.
        this.relatedNodes([nextEl]);
        return false; // FALHA
      },
      metadata: {
        description:
          "Separe links adjacentes com texto ou elementos visuais para evitar que sejam lidos como um único link pelos leitores de tela.",
      },
    },

    //1.8.1
    {
      id: "check-semantic-landmarks-v2",
      evaluate: function (node) {
        const recommendedLandmarks = ["header", "nav", "main", "footer"];
        const missingLandmarks = [];

        recommendedLandmarks.forEach((tag) => {
          if (!document.querySelector(tag)) {
            missingLandmarks.push(`<${tag}>`);
          }
        });

        const mainIsMissing = !document.querySelector("main");

        if (mainIsMissing) {
          // Anexa a lista de landmarks que estão faltando ao resultado.
          this.data({
            missing: missingLandmarks,
          });
          return false; // FALHA
        }

        return true; // PASSA
      },
      metadata: {
        description:
          "Inclua as landmarks semânticas essenciais como <header>, <nav>, <main> e <footer> para melhorar a estrutura e acessibilidade da página.",
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
          'Use target="_blank" em links que abrem nova aba, mas sempre adicione rel="noopener noreferrer", aria-label avisando que o link abre em nova aba evita que o usuário se perca, dá segurança e acessibilidade.',
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
          "Implemente eventos de teclado equivalentes aos de mouse para garantir acessibilidade a usuários que navegam sem mouse.",
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
        description:
          "Evite usar o evento ondblclick, pois ações importantes devem ser acessíveis com um único clique e via teclado.",
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
          "Aplique eventos apenas em elementos interativos para garantir comportamento acessível e previsível.",
      },
    },
    //2.2.6
    {
      id: "check-noscript-on-page",
      evaluate: function (node) {
        // Verifica se existe pelo menos um script na página
        const hasAnyScript = document.querySelector("script") !== null;

        // Se não houver nenhum script, a regra não se aplica e passa.
        if (!hasAnyScript) {
          return true;
        }

        // Se houver scripts, então procuramos por uma tag <noscript>.
        // O teste PASSA se a tag <noscript> for encontrada.
        const hasNoScriptTag = document.querySelector("noscript") !== null;
        return hasNoScriptTag;
      },
      metadata: {
        description:
          "Inclua um elemento <noscript> com conteúdo alternativo sempre que a página usar scripts para garantir acesso a usuários sem JavaScript.",
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
          "Inclua texto alternativo dentro dos elementos <object> para garantir conteúdo acessível quando o objeto não carregar.",
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
          "Inclua texto alternativo dentro dos elementos <embed> para assegurar que o conteúdo seja acessível caso o embed não carregue.",
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
          "Inclua texto alternativo dentro dos elementos <applet> para garantir acessibilidade caso o applet não seja suportado.",
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
          "Evite atualizações automáticas da página via meta refresh ou JavaScript para não prejudicar a experiência e a acessibilidade do usuário.",
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
          "Evite redirecionamentos automáticos via meta refresh ou scripts para garantir melhor experiência e acessibilidade aos usuários.",
      },
    },
    // 2.6.1
    {
      id: "check-blink-element",
      evaluate: function (node) {
        return node.querySelectorAll("blink").length === 0;
      },
      metadata: {
        description:
          "Não use o elemento <blink>, pois ele é obsoleto e prejudica a legibilidade e acessibilidade do conteúdo.",
      },
    },
    // 2.6.2
    {
      id: "check-marquee-element",
      evaluate: function (node) {
        return node.querySelectorAll("marquee").length === 0;
      },
      metadata: {
        description:
          "Evite usar o elemento <marquee>, pois é obsoleto e prejudica a acessibilidade e usabilidade do conteúdo.",
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
          "Evite usar imagens GIF animadas que causam movimentos ou intermitências que podem distrair ou prejudicar usuários sensíveis.",
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
          "Defina o atributo lang no elemento <html> para indicar o idioma principal da página e melhorar a acessibilidade.",
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
          "Aplique o atributo lang em elementos com texto visível ou garanta que herdaram esse atributo de um ancestral para informar o idioma correto.",
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
        description:
          "VInclua um título único e descritivo na página usando a tag <title> para melhorar usabilidade e SEO.",
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
        description:
          "Evite usar URLs como texto do link; prefira textos descritivos que indiquem o destino ou a ação do link.",
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
        description:
          "Não use apenas o atributo title para descrever links; inclua texto visível para garantir acessibilidade.",
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
          "Adicione texto alternativo descritivo nas imagens que funcionam como links para garantir acessibilidade.",
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
        description:
          "Use textos de link específicos e descritivos em vez de termos genéricos como 'clique aqui' para melhorar a acessibilidade e usabilidade.",
      },
    },
    // 3.5.10
    {
      id: "check-duplicate-href-different-text-v2",
      evaluate: function (node) {
        // Usamos um nome de cache diferente para esta nova versão
        if (!window.emagHrefMap_v2) {
          window.emagHrefMap_v2 = new Map();
          const allLinks = document.querySelectorAll("a[href]");

          allLinks.forEach((link) => {
            const href = link.href;
            // Armazenamos o objeto completo com texto e HTML
            const linkData = {
              text: link.textContent.trim(),
              html: link.outerHTML,
            };

            if (!linkData.text) return;

            if (!window.emagHrefMap_v2.has(href)) {
              window.emagHrefMap_v2.set(href, []);
            }
            window.emagHrefMap_v2.get(href).push(linkData);
          });
        }

        const currentHref = node.href;
        const linksForThisHref = window.emagHrefMap_v2.get(currentHref);

        if (linksForThisHref && linksForThisHref.length > 1) {
          // Verifica se realmente existem textos diferentes neste grupo
          const uniqueTexts = new Set(linksForThisHref.map((l) => l.text));
          if (uniqueTexts.size > 1) {
            // VIOLAÇÃO! Anexa a lista completa de objetos de link conflitantes.
            this.data({
              message: `O destino ${currentHref} é usado por links com ${uniqueTexts.size} textos diferentes.`,
              conflictingLinks: linksForThisHref,
            });
            return false; // FALHA
          }
        }
        return true; // PASSA
      },
      metadata: {
        description:
          "Evite usar o mesmo link (href) com textos diferentes para não confundir usuários e melhorar a clareza dos links.",
      },
    },
    //3.5.11
    {
      id: "check-same-text-different-href-cached-v2",
      evaluate: function (node) {
        // Cria o mapa de links na primeira execução (lógica de cache)
        if (!window.emagLinkMap) {
          window.emagLinkMap = new Map();
          const allLinks = document.querySelectorAll("a[href]");
          allLinks.forEach((link) => {
            const text = link.textContent.trim();
            if (!text) return;
            if (!window.emagLinkMap.has(text)) {
              window.emagLinkMap.set(text, new Set());
            }
            window.emagLinkMap.get(text).add(link.href);
          });
        }

        const currentText = node.textContent.trim();
        if (!currentText) {
          return true; // Passa em links sem texto
        }

        const hrefsForThisText = window.emagLinkMap.get(currentText);

        if (hrefsForThisText && hrefsForThisText.size > 1) {
          // VIOLAÇÃO ENCONTRADA!
          // Agora, vamos coletar os dados de todos os links conflitantes.
          const allLinksWithThisText = Array.from(
            document.querySelectorAll("a[href]")
          ).filter((link) => link.textContent.trim() === currentText);

          const duplicatesData = allLinksWithThisText.map((link) => {
            return {
              href: link.href,
              html: link.outerHTML,
            };
          });

          // Anexa a lista de duplicatas ao resultado deste nó específico.
          this.data({
            message: `Este link usa o texto '${currentText}', que está associado a ${hrefsForThisText.size} URLs diferentes.`,
            duplicates: duplicatesData,
          });

          return false; // FALHA
        }

        return true; // PASSA
      },
      metadata: {
        description:
          "Evite usar o mesmo texto de link para URLs diferentes para não confundir usuários e melhorar a clareza da navegação.",
      },
    },
    //3.5.12
    {
      id: "check-duplicate-title-text",
      evaluate: function (node) {
        const title = (node.getAttribute("title") || "").trim();
        const text = node.textContent.trim();

        // Se não houver title ou texto, não há duplicidade para verificar.
        // Outras regras (como emag-no-empty-tag) cuidam de links vazios.
        if (!title || !text) {
          return true; // PASSA (não é responsabilidade desta regra)
        }

        // Compara ambos em minúsculas para ignorar a diferença de capitalização.
        // Retorna 'false' (FALHA) se eles forem iguais, e 'true' (PASSA) se forem diferentes.
        return title.toLowerCase() !== text.toLowerCase();
      },
      metadata: {
        description:
          "Evite usar o mesmo texto no atributo title e no conteúdo visível do link para não gerar redundância desnecessária.",
      },
    },
    // 3.5.13
    {
      id: "check-long-link-text",
      evaluate: function (node) {
        const text = node.textContent.trim();
        return text.length <= 500;
      },
      metadata: {
        description:
          "Mantenha o texto dos links conciso, evitando textos excessivamente longos para facilitar a leitura e navegação.",
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
        description:
          "Use URLs corretamente formatadas com protocolos válidos para evitar erros de navegação e problemas de acessibilidade.",
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
          "Forneça texto alternativo descritivo para imagens informativas; use alt vazio apenas para imagens decorativas.",
      },
    },
    //3.6.3 CHECK
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
        description:
          "Evite usar o nome do arquivo como texto alternativo; crie descrições significativas para as imagens.",
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
          "leia mais",
          "saiba mais",
          "img",
        ];

        return !genericTerms.some(
          (term) => altText === term || altText.startsWith(term + " ")
        );
      },
      metadata: {
        description:
          "Evite usar termos genéricos como 'imagem' ou 'foto' no alt; prefira descrições específicas e significativas.",
      },
    },
    //3.6.7
    {
      id: "check-img-same-alt-different-src",
      evaluate: function (node) {
        const currentAlt = node.getAttribute("alt") || "";
        const currentSrc = node.getAttribute("src") || "";

        if (!currentAlt) return true;

        // Usa document.querySelectorAll diretamente (não precisa de context)
        const images = document.querySelectorAll("img[alt]");

        return !Array.from(images).some(
          (img) =>
            img !== node &&
            img.getAttribute("alt") === currentAlt &&
            img.getAttribute("src") !== currentSrc
        );
      },
      metadata: {
        description:
          "Não use o mesmo texto alternativo em imagens diferentes para evitar confusão e garantir clareza no conteúdo.",
        help: "EMAG 3.1 6.6.7 - Imagens diferentes não devem ter o mesmo texto alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.6.7",
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
        description:
          "Evite usar o mesmo texto nos atributos alt e title para imagens, garantindo descrições distintas e úteis.",
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
          "Forneça texto alternativo para imagens com mapas (usemap) e descrições em áreas (<area>) para garantir acessibilidade.",
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
        description:
          "Inclua um <caption> ou atributo summary em tabelas de dados para descrever seu conteúdo e melhorar a acessibilidade.",
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
          "Associe corretamente células de dados e cabeçalhos em tabelas usando atributos como scope, headers e ids para garantir acessibilidade.",
      },
    },
    // 3.11.2
    {
      id: "check-justified-align-attribute",
      evaluate: function (node) {
        return node.getAttribute("align") !== "justify";
      },
      metadata: {
        description:
          "Evite usar align='justify' para alinhamento de texto, pois dificulta a leitura e prejudica a acessibilidade.",
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
          "Evite usar text-align: justify no CSS, pois o texto justificado pode prejudicar a legibilidade e a acessibilidade.",
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
          "Adicione o atributo title com a descrição completa em elementos <abbr> ou <acronym> para explicar siglas e abreviações.",
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
          "Assegure que todos os elementos focáveis possuam estilos visíveis de foco para facilitar a navegação por teclado.",
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
          "Garanta que todos os elementos focáveis possuam estilos visíveis e claros no estado :focus-visible para facilitar a navegação por teclado.",
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
        description:
          "Verifique se a página contém vídeos para garantir que conteúdos multimídia sejam considerados na acessibilidade.",
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
        description:
          "Verifique se a página contém elementos de áudio para garantir que o conteúdo multimídia seja acessível.",
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
        description:
          "Detecte se a página contém vídeos em qualquer formato ou via iframe para considerar acessibilidade multimídia.",
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
        description:
          "Verifique se a página contém elementos ou players de áudio para garantir o tratamento adequado do conteúdo multimídia.",
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
          "Associe um label acessível a todos os elementos de formulário usando <label>, aria-label, aria-labelledby ou title.",
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
        description:
          "Use tabindex apenas para controlar a ordem de foco em elementos que não são naturalmente focalizáveis dentro dos formulários.",
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
          "Evite usar eventos de teclado e foco inline em elementos de formulário, prefira gerenciar eventos via JavaScript externo para maior acessibilidade e manutenção.",
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
          "Evite o uso de eventos inline de mouse e drag em elementos de formulário para garantir acessibilidade e melhor suporte a teclado.",
      },
    },
    //6.7.1
    {
      id: "check-fieldset-grouping-v2",
      evaluate: function (node) {
        const textInputs = node.querySelectorAll(
          'input[type="text"], input[type="password"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], textarea, select'
        ).length;
        const radioButtons = node.querySelectorAll(
          'input[type="radio"]'
        ).length;
        const checkboxes = node.querySelectorAll(
          'input[type="checkbox"]'
        ).length;

        // Um formulário PRECISA de agrupamento se tiver:
        // - Mais de 1 campo de texto/select/textarea, OU
        // - Mais de 1 botão de rádio, OU
        // - Mais de 1 caixa de seleção.
        const requiresGrouping =
          textInputs > 1 || radioButtons > 1 || checkboxes > 1;

        // Se, pela lógica acima, o formulário não precisa de agrupamento, o teste passa.
        if (!requiresGrouping) {
          return true;
        }

        // Se ele PRECISA de agrupamento, então verificamos se ele tem <fieldset> ou role="group".
        const hasFieldset = node.querySelector("fieldset") !== null;
        const hasAriaGroup =
          node.querySelector('[role="group"], [role="radiogroup"]') !== null;

        // O teste passa se um elemento de agrupamento for encontrado.
        return hasFieldset || hasAriaGroup;
      },
      metadata: {
        description:
          "Verifica se formulários com grupos de campos relacionados possuem <fieldset> ou um agrupamento ARIA.",
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
          "Agrupe opções em selects complexos usando <optgroup> ou roles ARIA para facilitar a navegação e compreensão.",
      },
    },
  ];

  //INICIO DAS REGRAS (RULES)
  const emagRules = [
    //6.7.2 CHECK
    {
      id: "emag-optgroup",
      selector: "form",
      any: ["check-optgroup"],
      enabled: true,
      tags: ["emag", "form", "select", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 6.7.2 - Selects com muitas opções devem usar optgroup.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.7.2",
      },
    },
    //6.7.1 CHECK
    {
      id: "emag-fieldset-grouping",
      selector: "form",
      any: ["check-fieldset-grouping-v2"], // <-- Usando o novo check
      enabled: true,
      tags: ["emag", "form", "grouping", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 6.7.1 - Formulários complexos ou com grupos de campos devem usar <fieldset> para agrupamento.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.7.1",
      },
    },
    //6.4.2 CHECK
    {
      id: "emag-form-mouse-events",
      selector: "form",
      any: ["check-form-mouse-events"],
      enabled: true,
      tags: ["emag", "form", "mouse", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 6.4.2 - Evitar eventos de mouse/drag exclusivos que prejudicam usuários de teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.4.2",
      },
    },
    //6.4.1 CHECK
    {
      id: "emag-form-keyboard-events",
      selector: "form",
      any: ["check-form-keyboard-events"],
      enabled: true,
      tags: ["emag", "form", "keyboard", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 6.4.1 - Evitar eventos de teclado/foco que podem prejudicar a acessibilidade.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.4.1",
      },
    },
    // 6.3.1 CHECK
    {
      id: "emag-form-tabindex",
      selector: "form",
      any: ["check-form-tabindex"],
      enabled: true,
      tags: ["emag", "form", "keyboard", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 6.3.1 - Evitar tabindex desnecessário em elementos de formulário.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.3.1",
        messages: {
          pass: "Formulário não contém tabindex desnecessários",
          fail: "Remova tabindex não-naturais dos elementos do formulário",
        },
      },
    },
    // 6.2.1 CHECK
    {
      id: "emag-input-label",
      selector:
        "input:not([type='hidden']):not([type='submit']):not([type='reset']):not([type='button']):not([type='image']), textarea, select",
      any: ["check-input-label"],
      enabled: true,
      tags: ["emag", "form", "label", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 6.2.1 - Campos de formulário devem ter labels associados.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r6.2.1",
        messages: {
          pass: "Elemento tem um label associado",
          fail: "Adicione um label para este elemento de formulário",
        },
      },
    },
    //5.4.1 CHECK
    {
      id: "emag-audio-content-presence",
      selector: "html",
      any: ["check-audio-content-presence"],
      enabled: true,
      tags: ["emag", "media", "audio", "acessibilidade"],
      impact: "minor",
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
    //5.3.1 CHECK
    {
      id: "emag-video-content-presence",
      selector: "html",
      any: ["check-video-content-presence"],
      enabled: true,
      tags: ["emag", "media", "video", "acessibilidade"],
      impact: "minor",
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
    //5.2.1 CHECK
    {
      id: "emag-audio-presence",
      selector: "html",
      any: ["check-audio-presence"],
      enabled: true,
      tags: ["emag", "media", "audio", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 5.2.1 - Páginas contendo áudio devem fornecer alternativas acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.2.1",
      },
    },
    //5.1.1 CHECK
    {
      id: "emag-video-presence",
      selector: "html",
      any: ["check-video-presence"],
      enabled: true,
      tags: ["emag", "media", "video", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 5.1.1 - Páginas contendo vídeos devem fornecer alternativas acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r5.1.1",
      },
    },
    // 4.4.1.2 CHECK
    {
      id: "emag-focus-visible-explicit",
      selector:
        "a, button, input, select, textarea, [tabindex]:not([tabindex='-1']), [contenteditable='true']",
      any: ["check-focus-visible-styles"],
      enabled: true,
      tags: ["emag", "focus", "keyboard", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 4.4.1 - Elementos devem ter estilo visível com :focus-visible.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r4.4.1",
        techniques: ["C15", "G195"],
      },
    },
    // 4.4.1.1 CHECK
    {
      id: "emag-focus-visible",
      selector:
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      any: ["check-focus-visible"],
      enabled: true,
      tags: ["emag", "focus", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 4.4.1 - Elementos focalizáveis devem ter estilo de foco visível.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r4.4.1",
      },
    },
    // 3.12.1 CHECK
    {
      id: "emag-abbr-title",
      selector: "abbr, acronym",
      any: ["check-abbr-title"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.12.1 - Siglas devem ter atributo title explicativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.12.1",
      },
    },
    // 3.11.3 CHECK
    {
      id: "emag-justified-css",
      selector: "p",
      any: ["check-justified-css"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.11.3 - Evitar text-align: justify em parágrafos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.11.3",
      },
    },
    // 3.11.2 CHECK
    {
      id: "emag-justified-align-attribute",
      selector: "p[align]",
      any: ["check-justified-align-attribute"],
      enabled: true,
      tags: ["emag", "text", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.11.2 - Evitar parágrafos com align='justify'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.11.2",
      },
    },
    // 3.10.1 CHECK
    {
      id: "emag-table-cell-association",
      selector: "table",
      any: ["check-table-cell-association"],
      enabled: true,
      tags: ["emag", "table", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.10.1 - Tabelas devem ter células associadas via headers, scope ou estrutura semântica.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.10.1",
      },
    },
    // 3.9.1 CHECK
    {
      id: "emag-table-caption-summary",
      selector: "table",
      any: ["check-table-caption-summary"],
      enabled: true,
      tags: ["emag", "table", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 3.9.1 - Tabelas de dados devem ter caption ou summary.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.9.1",
      },
    },
    // 3.7.1 CHECK
    {
      id: "emag-image-map-alt",
      selector: "img[usemap], area[href]",
      any: ["check-image-map-alt"],
      enabled: true,
      tags: ["emag", "image", "map", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.7.1 - Mapas de imagem devem ter descrição alternativa.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.7.1",
      },
    },
    //3.6.8 CHECK
    {
      id: "emag-img-duplicate-alt-title",
      selector: "img[alt][title]",
      any: ["check-img-duplicate-alt-title"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.6.8 - Evitar alt e title com o mesmo conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.8",
      },
    },
    //3.6.7 CHECK
    {
      id: "emag-img-same-alt-different-src",
      selector: "img[alt][src]",
      any: ["check-img-same-alt-different-src"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 3.6.7 - Imagens diferentes não devem ter a mesma descrição.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.7",
      },
    },
    // 3.6.4 CHECK
    {
      id: "emag-img-generic-alt",
      selector: "img[alt]",
      any: ["check-img-generic-alt"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.6.4 - Evitar descrições genéricas no atributo alt.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6.4",
      },
    },
    // 3.6.3 CHECK
    {
      id: "emag-img-alt-filename",
      selector: "img[src][alt]",
      any: ["check-img-alt-filename"],
      enabled: true,
      tags: ["emag", "image", "acessibilidade"],
      impact: "serious",
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
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.6.2 - Adicione um atributo alt com texto descritivo em todas as imagens para garantir acessibilidade.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.6",
      },
    },
    // 3.5.15 ???
    {
      id: "emag-malformed-urls",
      selector: "a[href]",
      any: ["check-malformed-urls"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 3.5.15 - Evitar URLs mal formatadas ou protocolos inseguros.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.13 CHECK
    {
      id: "emag-long-link-text",
      selector: "a[href]",
      any: ["check-long-link-text"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "minor",
      metadata: {
        help: "EMAG 3.1 3.5.13 - Evitar textos de link muito longos (>2000 chars).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },

    // 3.5.12 CHECK
    {
      id: "emag-duplicate-title-text",
      selector: "a[href][title]",
      any: ["check-duplicate-title-text"],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "serious",
      metadata: {
        help: "EMAG 3.1 3.5.12 - Evitar title igual ao texto do link.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },

    // 3.5.11 TESTE
    {
      id: "emag-same-text-different-href",
      selector: "a[href]",
      enabled: true,
      tags: ["emag", "link"],
      impact: "serious",
      all: ["check-same-text-different-href-cached-v2"], // <-- Use o novo check aqui

      after: function (results) {
        delete window.emagLinkMap;
        return results;
      },

      metadata: {
        description:
          "Links com o mesmo texto devem apontar para o mesmo destino.",
        help: "EMAG 3.1 R3.5.11 - Evitar links com mesmo texto para destinos diferentes.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.10 TESTE
    {
      id: "emag-duplicate-href-different-text",
      selector: "a[href]",
      enabled: true,
      tags: ["emag", "link"],
      impact: "serious",
      all: ["check-duplicate-href-different-text-v2"], // <-- Usando o novo check

      // Função de limpeza para o novo cache
      after: function (results) {
        delete window.emagHrefMap_v2;
        return results;
      },

      metadata: {
        description:
          "Links com o mesmo destino (href) não devem ter textos diferentes.",
        help: "EMAG 3.1 R3.5.10 - Evitar links com mesmo destino e textos diferentes.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.6 CHECK
    {
      id: "emag-generic-link-text",
      selector: "a[href]",
      any: ["check-generic-link-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "serious",
      metadata: {
        description: "Links devem ter textos descritivos e não genéricos.",
        help: "EMAG 3.1 3.5.6 - Evitar textos de link genéricos como 'clique aqui'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.5 CHECK
    {
      id: "emag-image-link-alt",
      selector: "a[href]",
      any: ["check-image-link-alt"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "image", "acessibilidade"],
      impact: "serious",
      metadata: {
        description: "Links com imagens devem ter texto alternativo.",
        help: "EMAG 3.1 3.5.5 - Imagens dentro de links devem ter atributo alt descritivo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.4 CHECK
    {
      id: "emag-title-only-link",
      selector: "a[href][title]",
      any: ["check-title-only-link"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "serious",
      metadata: {
        description: "Links não devem depender apenas do atributo title.",
        help: "EMAG 3.1 3.5.4 - Evitar links que usam apenas title como descrição.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.3 CHECK
    {
      id: "emag-empty-link",
      selector: "a[href]",
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "serious",
      // CORREÇÃO: Usando o nome correto do check que já existe no seu arquivo.
      all: ["check-no-text-content"],
      any: [],
      none: [],
      metadata: {
        description: "Links não devem estar vazios.",
        help: "EMAG 3.1 3.5.3 - Evitar links sem texto descritivo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },
    // 3.5.2 CHECK
    {
      id: "emag-link-url-text",
      selector: "a[href]",
      any: ["check-link-url-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "link", "acessibilidade"],
      impact: "minor",
      metadata: {
        description: "Links não devem ter URLs como texto descritivo.",
        help: "EMAG 3.1 3.5.2 - Evitar links com texto descritivo em formato de URL.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.5",
      },
    },

    // 3.3 CHECK
    {
      id: "emag-page-title",
      selector: "html", // Aplica ao documento inteiro
      any: ["check-page-title"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "acessibilidade", "head"],
      impact: "serious",
      metadata: {
        description:
          "Verifica se a página possui um título descritivo e informativo.",
        help: "EMAG 3.1 3.3.1 - A página deve ter um título não vazio na tag <title>.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.3.1",
      },
    },
    // 3.2.1 CHECK
    {
      id: "emag-element-lang",
      selector: "*:not(html):not([lang])", // Todos elementos exceto html, ou com atributo lang explícito
      any: ["check-visible-text-lang"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "acessibilidade", "i18n"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se elementos com conteúdo em idioma diferente do principal estão identificados com o atributo lang.",
        help: "EMAG 3.1 3.2.1 - Elementos com conteúdo em idioma diferente do principal devem ter atributo lang.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.2",
      },
    },
    // 3.1.1 CHECK
    {
      id: "emag-lang-attribute",
      selector: "html",
      any: ["check-html-lang"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "idioma"],
      impact: "serious",
      metadata: {
        description:
          "Identificação do idioma principal da página por meio do atributo lang ou xml:lang conforme o doctype.",
        help: "EMAG 3.1.1 - Informar o idioma principal da página com o atributo lang (HTML) ou xml:lang (XHTML).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r3.1",
      },
    },
    // 2.6.1 CHECK
    {
      id: "emag-no-blink",
      selector: "blink",
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
    // 2.6.2 CHECK
    {
      id: "emag-no-marquee",
      selector: "marquee",
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
    // 2.6.3 CHECK
    {
      id: "emag-no-animated-gif",
      selector: "img[src$='.gif']",
      any: ["check-animated-gif"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "imagem", "gif", "acessibilidade"],
      impact: "minor",
      metadata: {
        description:
          "Verifica a presença de imagens GIF com intermitência ou movimentação na tela.",
        help: "EMAG 3.1 R2.6.3 - Imagens em movimento, como GIFs animados, podem gerar desconforto, epilepsia ou dificuldades para usuários sensíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.6",
      },
    },
    // 2.4.1 CHECK
    {
      id: "emag-auto-redirect",
      selector: "meta[http-equiv='refresh']",
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
    // 2.3.1 CHECK
    {
      id: "emag-auto-refresh",
      selector: "meta[http-equiv='refresh']",
      any: ["check-auto-refresh"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "tempo"],
      impact: "minor",
      metadata: {
        description: "Verifica se a página possui atualização automática.",
        help: "EMAG 3.1 R2.3.1 - Evitar atualizações automáticas que prejudiquem a navegação dos usuários.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.3",
      },
    },
    // 2.2.4 CHECK
    {
      id: "emag-applet-has-text",
      selector: "applet",
      any: ["check-applet-has-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se os elementos <applet> possuem conteúdo alternativo textual.",
        help: "EMAG 3.1 R2.2.4 - Elementos <applet> devem fornecer conteúdo alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.2.3 CHECK
    {
      id: "emag-embed-has-text",
      selector: "embed",
      any: ["check-embed-has-text"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "alternatives"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se os elementos <embed> possuem conteúdo alternativo textual.",
        help: "EMAG 3.1 R2.2.3 - Elementos <embed> devem fornecer conteúdo alternativo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.2.2 CHECK
    {
      id: "emag-object-has-text",
      selector: "object",
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
    // 2.2.6 CHECK
    {
      id: "emag-noscript-with-script",
      selector: "html",
      any: ["check-noscript-on-page"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "interaction"],
      impact: "serious",
      metadata: {
        description:
          "Páginas que usam scripts para exibir conteúdo ou funcionalidade devem fornecer uma alternativa acessível com <noscript>.",
        help: "EMAG 3.1 R2.2.6 - Páginas que usam scripts devem fornecer alternativas com <noscript>.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.2",
      },
    },
    // 2.1.8 CHECK
    {
      id: "emag-event-on-non-interactive",
      selector:
        "*:not(a, button, input, textarea, select, label, option, details, summary, script, style, meta, link, title)",
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
    //2.1.6 CHECK
    {
      id: "emag-dblclick-event",
      selector: "[ondblclick]",
      any: ["check-dblclick-event"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "interaction"],
      impact: "minor",
      metadata: {
        description:
          "Garante que não haja uso do evento ondblclick, que não é acessível para teclado.",
        help: "EMAG 3.1 R2.1.6 - Evite o uso de eventos ondblclick que não possuem equivalência natural no teclado.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r2.1",
      },
    },

    // 2.1.2 CHECK
    {
      id: "emag-mouse-only-events",
      selector: "[onmousedown], [onmouseup], [onmouseover], [onmouseout]",
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

    // 1.9.1 CHECK
    {
      id: "emag-link-target-blank",
      selector: "a[target='_blank']",
      any: ["check-link-target-blank"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "link"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se há links que abrem em nova aba ou janela utilizando target='_blank'.",
        help: "EMAG 3.1 R1.9.1 - Informar aos usuários quando um link abre em nova aba ou janela utilizando target='_blank'.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.9",
      },
    },
    //1.8.1 TESTAR
    {
      id: "emag-semantic-landmarks-missing",
      selector: "html",
      enabled: true,
      tags: ["emag", "html", "semantics", "structure"],
      impact: "moderate",
      all: ["check-semantic-landmarks-v2"], // Usa o check correto
      any: [],
      none: [],
      metadata: {
        description:
          "Verifica se landmarks essenciais como <main> estão presentes e lista outras recomendadas que estão ausentes.",
        help: "EMAG 3.1 R1.8.3 - Utilize landmarks semânticas (header, footer, nav, main) para estruturar o conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.8",
      },
    },

    // 1.7.1 TESTAR
    {
      id: "emag-adjacent-links-without-separation",
      selector: "a[href]", // A regra agora roda em CADA link
      enabled: true,
      tags: ["emag", "html", "link"],
      impact: "serious",
      all: ["check-if-next-is-unseparated-link"],
      any: [],
      none: [],
      metadata: {
        description:
          "Verifica se há links adjacentes sem separação textual ou por elementos.",
        help: "EMAG 3.1 R1.7.1 - Links adjacentes devem ter separação, seja por texto (ex: ' | ' ou ' / ') ou por elementos (ex: <span>, <li>).",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.7",
      },
    },
    // 1.6.2 TESTAR
    {
      id: "emag-form-inside-table",
      selector: "table form",
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
    // 1.6.1 AGORA COM CHECK
    {
      id: "emag-table-exists",
      selector: "table",
      any: ["emag-table-presence"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "table"],
      impact: "minor",
      metadata: {
        description: "Verifica se existem tabelas na página.",
        help: "EMAG 3.1 R1.6.1 - Foram utilizadas tabelas na página. Evite usar tabelas para layout, use apenas para dados tabulares.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.6",
      },
    },

    // 1.5.1 CHECK tem que revisar isso ai talvez precise separar como as outras // precisa separar
    {
      id: "emag-ancoras-bloco",
      selector: "html",
      any: ["check-anchor-skip-links-presence"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "serious",
      metadata: {
        description:
          "Deve haver âncoras acessíveis no início da página que permitam pular para blocos de conteúdo como menu, conteúdo principal e busca.",
        help: "EMAG 3.1 R1.5.1 - Devem haver âncoras no topo da página para pular para blocos de conteúdo.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    //1.5.2 CHECK
    {
      id: "emag-ancoras-bloco-existente",
      selector: "a[href^='#']", // Roda em cada link que começa com #
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos", "link"],
      impact: "serious",
      // A regra passa se o check confirmar que o destino da âncora existe.
      all: ["check-anchor-target-exists"],
      any: [],
      none: [],
      metadata: {
        description:
          "Verifica se o destino de uma âncora (link interno) existe na página.",
        help: "EMAG 3.1 R1.5.2 - Todas as âncoras devem possuir destinos que existam.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    // 1.5.3 FAZER
    {
      id: "emag-ancoras-",
      selector: "body",
      any: [
        "ancora-para-bloco",
        "primeiro-link-para-conteudo",
        "check-anchor-skip-links-presence",
      ],
      all: ["accesskey-unico", "check-anchor-skip-links-target"],
      none: [],
      enabled: false,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "serious",
      metadata: {
        description:
          "Deve haver âncoras acessíveis no início da página que permitam pular para blocos de conteúdo como menu, conteúdo principal e busca.",
        help: "EMAG 3.1 R1.5.3 - Âncoras acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    // 1.5.9 CHECK
    {
      id: "emag-ancoras-primeiro-link",
      selector: "html",
      any: ["primeiro-link-para-conteudo"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "minor",
      metadata: {
        description:
          "É importante ressaltar que o primeiro link da página deve ser o de ir para o conteúdo.",
        help: "EMAG 3.1 R1.5.9 - Âncora deve ser o primeiro link da página.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    // 1.5.11 CHECK
    {
      id: "emag-ancoras-acesskey-unico",
      selector: "html",
      any: [],
      all: ["accesskey-unico"],
      none: [],
      enabled: true,
      tags: ["emag", "barra-acessibilidade", "atalhos"],
      impact: "serious",
      metadata: {
        description: "Todas as acesskey devem possuir unicidade.",
        help: "EMAG 3.1 R1.5 - Âncoras acessíveis.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.5",
      },
    },
    // 1.2.3
    {
      id: "emag-no-empty-tag",
      // Seletor para encontrar os principais elementos que deveriam ter conteúdo
      selector:
        "p, h1, h2, h3, h4, h5, h6, a, th, td, li, blockquote, figcaption, button, span, iframe,dd, base, defs",
      enabled: true,
      tags: ["emag", "structure", "text"],
      impact: "serious",
      any: [],
      all: ["check-no-text-content"],
      none: [],
      metadata: {
        description:
          "Verifica se elementos textuais como parágrafos, cabeçalhos e links não estão vazios, a menos que tenham um nome acessível alternativo.",
        help: "eMAG 1.2.3 - Presença de tags HTML sem atributo e conteúdo de texto.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.2.3",
      },
    },

    // 1.1.3 CHECK
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
    // 1.1.4 CHECK
    {
      id: "css-internal",
      selector: "style",
      any: ["fail-if-exists"],
      all: [],
      none: [],
      excludeHidden: false,
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
    // 1.1.5 CHECK
    {
      id: "js-inline",
      selector:
        "[onload], [onunload], [onblur], [onchange], [onfocus], [onsearch], [onselect], [onsubmit], [onkeydown], [onkeypress], [onkeyup], [onclick], [ondblclick], [onmousedown], [onmousemove], [onmouseout], [onmouseover], [onmouseup], [onmousewheel], [oncopy], [oncut], [onpaste], [onabort]",
      any: ["fail-if-exists"],
      all: [],
      none: [],
      excludeHidden: false,
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
    // 1.1.6 CHECK
    {
      id: "js-internal",
      selector: "script:not([src])",
      any: ["fail-if-exists"],
      all: [],
      none: [],
      excludeHidden: false,
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

    //1.3.1 CHECK
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
    // 1.3.2 CHECK
    {
      id: "emag-heading-hierarchy",
      selector: "html",
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
    // 1.3.4 CHECK
    {
      id: "emag-only-h1",
      selector: "h1",
      any: ["check-only-h1"],
      all: [],
      none: [],
      enabled: true,
      tags: ["emag", "html", "heading"],
      impact: "minor",
      metadata: {
        description:
          "Verifica se foi usado apenas <h1> sem outros níveis de cabeçalho.",
        help: "EMAG 3.1 R1.3.4 Utilize outros níveis de cabeçalho além do <h1> para categorizar os conteúdos.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.3",
      },
    },
    // 1.3.6 CHECK
    {
      id: "emag-multiple-h1",
      selector: "h1",
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
    // 1.4.1 TESTAR
    // Substitua a regra antiga por esta no seu array `emagRules`
    {
      id: "emag-content-before-menu",
      // 1. O seletor agora busca por todos os possíveis elementos de menu
      selector: 'nav, #menu, #navigation, [role="navigation"]',
      enabled: true,
      tags: ["emag", "html", "order", "structure"],
      impact: "minor",
      // 2. A regra passará se o check 'check-menu-is-after-content' retornar 'true'
      all: ["check-menu-is-after-content"],
      any: [],
      none: [],
      metadata: {
        description:
          "Verifica se o conteúdo principal está antes do menu no HTML.",
        help: "EMAG 3.1 R1.4.1 O bloco de conteúdo deve estar antes do menu no código HTML para garantir a ordem lógica de leitura.",
        helpUrl: "https://emag.governoeletronico.gov.br/#r1.4",
      },
    },
    // 1.4.3 CHECK
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

    // 1.4.6 CHECK
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
    checks: emagChecks, // O array de checks agora não tem mais o 'check-color-contrast'
    rules: [
      // AQUI ESTÁ A MÁGICA:
      // Estamos dizendo ao Axe para pegar a regra nativa 'color-contrast'
      // e adicionar a tag 'emag' a ela.
      {
        id: "color-contrast",
        tags: ["emag", "color"],
      },

      // O operador '...' pega todas as suas outras regras customizadas e as adiciona à configuração.
      ...emagRules,
    ],
  });
})();
