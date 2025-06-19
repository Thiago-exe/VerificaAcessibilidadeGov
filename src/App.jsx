import React, { useState, useMemo, useEffect } from "react";
import DropdownAcessibilidade from "./DropdownAcessibilidade";

const CATEGORIAS_EMAG = {
  'Marcação': ['html', 'parsing', 'semantics', 'structure', 'padrões', 'table'],
  'Comportamento': ['interaction', 'tempo', 'keyboard', 'atalhos', 'barra-acessibilidade'],
  'Conteúdo/Informação': ['text', 'alternatives', 'language', 'i18n', 'idioma', 'link'],
  'Apresentação/Design': ['color', 'focus', 'order'],
  'Multimídia': ['media', 'imagem', 'parpadeo', 'image'],
  'Formulários': ['form'],
};

const groupResultsByCategory = (results) => {
  if (!results) return null;
  const initialGroup = { violations: [], incomplete: [], passes: [], inapplicable: [] };
  const grouped = Object.keys(CATEGORIAS_EMAG).reduce((acc, cat) => {
    acc[cat] = { ...initialGroup, violations: [], incomplete: [], passes: [], inapplicable: [] };
    return acc;
  }, {});
  grouped["Outros"] = { ...initialGroup, violations: [], incomplete: [], passes: [], inapplicable: [] };
  const assignToCategory = (item, type) => {
    let assigned = false;
    if (item.tags) {
      for (const [category, tags] of Object.entries(CATEGORIAS_EMAG)) {
        if (item.tags.some(tag => tags.includes(tag))) {
          grouped[category][type].push(item);
          assigned = true;
          break; 
        }
      }
    }
    if (!assigned) {
      grouped["Outros"][type].push(item);
    }
  };
  Object.keys(results).forEach(type => {
      if(Array.isArray(results[type])) {
          results[type].forEach(item => assignToCategory(item, type));
      }
  });
  return grouped;
};

const REGRAS_CRITICAS = [
  'color-contrast', 'emag-input-label', 'emag-no-empty-tag', 
  'emag-heading-hierarchy', 'emag-mouse-only-events', 'img-sem-alt-emag', 'emag-img-alt', 'emag-img-generic-alt'
];

function App() {
  const [url, setUrl] = useState("");
  const [resultados, setResultados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [runMode, setRunMode] = useState('emag');
  const [activeTab, setActiveTab] = useState("Marcação");
  const [showScroll, setShowScroll] = useState(false);
  // 1. NOVO ESTADO PARA CONTROLAR O TIPO DE PONTUAÇÃO
  const [scoringMode, setScoringMode] = useState('emagPonderado'); // 'simples' ou 'emagPonderado'

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400){
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400){
      setShowScroll(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const filtrarRegrasEmag = (itens) => {
    if (!itens) return [];
    return itens.filter(
      (item) =>
        item.tags?.includes("emag") ||
        item.id?.toLowerCase().includes("emag")
    );
  };

  const testarUrl = async () => {
    setCarregando(true);
    setResultados(null);
    try {
      const resposta = await fetch("http://localhost:3001/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, runMode }),
      });
      const dados = await resposta.json();
      setResultados(dados);
      const firstCategory = Object.keys(groupResultsByCategory(dados) || {})[0] || 'Marcação';
      setActiveTab(firstCategory);
    } catch (erro) {
      alert("Erro ao analisar a URL");
      console.error(erro);
    }
    setCarregando(false);
  };

  const groupedResults = useMemo(() => groupResultsByCategory(resultados), [resultados]);

  // Hook 'useMemo' para calcular o resumo apenas quando os resultados mudarem
  const resumo = useMemo(() => {
    if (!resultados) return {};
    
    // Contagens básicas
    const violations = resultados.violations;
    const passes = resultados.passes;
    const incomplete = resultados.incomplete;
    const inapplicable = resultados.inapplicable;

    const errosCount = violations.filter(v => v.impact === 'serious').length;
    const avisosCount = violations.filter(v => v.impact !== 'serious').length + incomplete.length;
    const aprovadasCount = passes.length;
    const inaplicaveisCount = inapplicable.length;

    // Lógica para Porcentagem Simples
    const totalAplicaveisSimples = violations.length + passes.length + incomplete.length;
    const porcentagemSimples = totalAplicaveisSimples > 0
      ? ((aprovadasCount / totalAplicaveisSimples) * 100).toFixed(1)
      : "100.0";

    // Lógica para Porcentagem Ponderada eMAG
    const pesos = { padrao: 1, critico: 5 };
    const regrasSeriousAplicaveis = [
      ...violations.filter(r => r.impact === 'serious'),
      ...passes.filter(r => r.impact === 'serious')
    ];
    let totalPontosPossiveis = 0;
    regrasSeriousAplicaveis.forEach(regra => {
      totalPontosPossiveis += REGRAS_CRITICAS.includes(regra.id) ? pesos.critico : pesos.padrao;
    });
    let pontosPerdidos = 0;
    violations.forEach(violacao => {
      if (violacao.impact === 'serious') {
        pontosPerdidos += REGRAS_CRITICAS.includes(violacao.id) ? pesos.critico : pesos.padrao;
      }
    });
    const porcentagemPonderada = totalPontosPossiveis > 0
      ? (((totalPontosPossiveis - pontosPerdidos) / totalPontosPossiveis) * 100)
      : 100;

    return { 
      erros: errosCount, 
      avisos: avisosCount, 
      aprovadas: aprovadasCount, 
      inaplicaveis: inaplicaveisCount, 
      porcentagemSimples: porcentagemSimples,
      porcentagemEMAG: Math.max(0, porcentagemPonderada).toFixed(1)
    };
  }, [resultados]);

  const tabOrder = [...Object.keys(CATEGORIAS_EMAG), 'Outros'];

  return (
    <div style={{ padding: "2rem", backgroundColor: "#1e1e1e", color: "white", minHeight: "100vh" }}>
      <button className={`back-to-top-btn ${showScroll ? 'show' : ''}`} onClick={scrollTop} aria-label="Voltar ao topo" title="Voltar ao topo">▲</button>
      <h1>Teste de Acessibilidade eMAG</h1>
      <input type="text" placeholder="https://www.exemplo.com" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "300px", marginRight: "1rem", padding: "0.5rem" }} />
      <div style={{ margin: '1rem 0' }}>
        <label style={{ marginRight: '1rem' }}><input type="radio" value="emag" checked={runMode === 'emag'} onChange={e => setRunMode(e.target.value)} /> Apenas eMAG</label>
        <label style={{ marginRight: '1rem' }}><input type="radio" value="wcag" checked={runMode === 'wcag'} onChange={e => setRunMode(e.target.value)} /> Apenas WCAG (Axe-core)</label>
        <label><input type="radio" value="both" checked={runMode === 'both'} onChange={e => setRunMode(e.target.value)} /> Ambos</label>
      </div>
      <button onClick={testarUrl} disabled={carregando} style={{ padding: "0.5rem 1rem" }}>{carregando ? "Analisando..." : "Testar"}</button>
      
      {carregando && <p style={{marginTop: '1rem'}}>Isso pode levar alguns instantes...</p>}
      {resultados && groupedResults && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ backgroundColor: "#2c2c2c", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #444" }}>
            <h2 style={{ marginBottom: "1rem" }}>📊 Resumo da Avaliação</h2>

            {/* 2. NOVO SELETOR PARA O TIPO DE PONTUAÇÃO */}
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #444' }}>
              <strong>Métrica de Pontuação:</strong>
              <label style={{ marginLeft: '1rem' }}>
                <input type="radio" value="emagPonderado" checked={scoringMode === 'emagPonderado'} onChange={() => setScoringMode('emagPonderado')} />
                Ponderada eMAG
              </label>
              <label style={{ marginLeft: '1rem' }}>
                <input type="radio" value="simples" checked={scoringMode === 'simples'} onChange={() => setScoringMode('simples')} />
                Simples
              </label>
            </div>

            <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
              {/* 3. EXIBIÇÃO CONDICIONAL DA PONTUAÇÃO */}
              {scoringMode === 'emagPonderado' && (
                <li><strong>⭐ Porcentagem de Conformidade eMAG:</strong> {resumo.porcentagemEMAG}%</li>
              )}
              {scoringMode === 'simples' && (
                <li><strong>📈 Porcentagem de Aprovação Simples:</strong> {resumo.porcentagemSimples}%</li>
              )}
              <li><strong>❌ Erros (impacto 'serious'):</strong> {resumo.erros}</li>
              <li><strong>⚠️ Avisos (impacto 'minor' ou 'moderate' + incompletos):</strong> {resumo.avisos}</li>
              <li><strong>✅ Aprovadas:</strong> {resumo.aprovadas}</li>
              <li><strong>🚫 Inaplicáveis:</strong> {resumo.inaplicaveis}</li>
            </ul>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {tabOrder.map(tabName => {
              const tabData = groupedResults[tabName];
              const hasContent = tabData && (tabData.violations.length > 0 || tabData.incomplete.length > 0 || tabData.passes.length > 0 || tabData.inapplicable.length > 0);
              if (!hasContent) return null;
              const violationsToCount = (tabName === 'Outros' ? tabData.violations : filtrarRegrasEmag(tabData.violations)).filter(v => v.impact === 'serious');
              const warningsToCount = (tabName === 'Outros' ? tabData.violations.filter(v => v.impact !== 'serious') : filtrarRegrasEmag(tabData.violations).filter(v => v.impact !== 'serious')).length + tabData.incomplete.length;
              let statusIndicator = null;
              if (violationsToCount.length > 0) {
                statusIndicator = <span style={{ marginLeft: '8px', color: '#ff8a80', fontWeight: 'bold' }}>❌ {violationsToCount.length}</span>;
              } else if (warningsToCount > 0) {
                statusIndicator = <span style={{ marginLeft: '8px', color: '#ffd54f', fontWeight: 'bold' }}>⚠️ {warningsToCount}</span>;
              } else {
                statusIndicator = <span style={{ marginLeft: '8px' }}>✅</span>;
              }
              return (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', border: 'none', background: 'transparent', color: activeTab === tabName ? '#4fc3f7' : '#ccc', borderBottom: activeTab === tabName ? '3px solid #4fc3f7' : '3px solid transparent', fontSize: '1rem', fontWeight: activeTab === tabName ? 'bold' : 'normal', transition: 'color 0.2s, border-bottom 0.2s', display: 'flex', alignItems: 'center' }}
                >
                  {tabName}
                  {statusIndicator}
                </button>
              );
            })}
          </div>
          <div>
            {groupedResults[activeTab] && (
              <>
                <DropdownAcessibilidade titulo="❌ Erros" itens={( activeTab === 'Outros' ? groupedResults[activeTab].violations : filtrarRegrasEmag(groupedResults[activeTab].violations) ).filter(v => v.impact === 'serious')} />
                <DropdownAcessibilidade titulo="⚠️ Avisos" itens={( activeTab === 'Outros' ? groupedResults[activeTab].violations.filter(v => v.impact !== 'serious') : filtrarRegrasEmag(groupedResults[activeTab].violations).filter(v => v.impact !== 'serious') ).concat(groupedResults[activeTab].incomplete)} />
                <DropdownAcessibilidade titulo="✅ Aprovadas" itens={groupedResults[activeTab].passes} />
                <DropdownAcessibilidade titulo="🚫 Inaplicáveis" itens={groupedResults[activeTab].inapplicable} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;