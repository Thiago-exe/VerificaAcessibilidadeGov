import React, { useState, useMemo } from "react";
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

// --- NOVA LÓGICA DE PONTUAÇÃO ---

// 1. LISTA DE REGRAS CONSIDERADAS MAIS CRÍTICAS
const REGRAS_CRITICAS = [
  'color-contrast',           // Contraste é fundamental
  'emag-input-label',         // Formulários inacessíveis quebram a funcionalidade
  'emag-no-empty-tag',        // Elementos sem nome são barreiras
  'emag-heading-hierarchy',   // Essencial para navegação com leitor de tela
  'emag-mouse-only-events'    // Impede o uso por teclado
];

// 2. FUNÇÃO QUE CALCULA A NOVA PORCENTAGEM
const calcularPorcentagemEmag = (resultados) => {
  if (!resultados) return "100.0";

  const pesos = {
    padrao: 1,  // Peso para um erro 'serious' comum
    critico: 5  // Peso para um erro 'serious' da nossa lista de regras críticas
  };

  const regrasSerious = [
    ...resultados.violations.filter(r => r.impact === 'serious'),
    ...resultados.passes.filter(r => r.impact === 'serious')
  ];

  if (regrasSerious.length === 0) {
    return "100.0"; // Se nenhuma regra 'serious' foi aplicável, a conformidade é total.
  }

  let totalPontosPossiveis = 0;
  regrasSerious.forEach(regra => {
    totalPontosPossiveis += REGRAS_CRITICAS.includes(regra.id) ? pesos.critico : pesos.padrao;
  });

  let pontosPerdidos = 0;
  resultados.violations.forEach(violacao => {
    if (violacao.impact === 'serious') {
      pontosPerdidos += REGRAS_CRITICAS.includes(violacao.id) ? pesos.critico : pesos.padrao;
    }
  });
  
  if (totalPontosPossiveis === 0) {
    return "100.0";
  }

  const porcentagem = ((totalPontosPossiveis - pontosPerdidos) / totalPontosPossiveis) * 100;
  
  return Math.max(0, porcentagem).toFixed(1);
};


function App() {
  const [url, setUrl] = useState("");
  const [resultados, setResultados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [runMode, setRunMode] = useState('emag');
  const [activeTab, setActiveTab] = useState("Marcação");

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

  const resumo = useMemo(() => {
    if (!resultados) return {};
    const erros = resultados.violations.filter(v => v.impact === 'serious').length;
    const avisos = resultados.violations.filter(v => v.impact !== 'serious').length + resultados.incomplete.length;
    const aprovadas = resultados.passes.length;
    const inaplicaveis = resultados.inapplicable.length;
    const totalAvaliadas = erros + avisos + aprovadas + inaplicaveis;
    const porcentagemEMAG = calcularPorcentagemEmag(resultados);

    return { erros, avisos, aprovadas, inaplicaveis, totalAvaliadas, porcentagemEMAG };
  }, [resultados]);

  const tabOrder = [...Object.keys(CATEGORIAS_EMAG), 'Outros'];

  return (
    <div style={{ padding: "2rem", backgroundColor: "#1e1e1e", color: "white", minHeight: "100vh" }}>
      <h1>Teste de Acessibilidade eMAG</h1>
      <input
        type="text"
        placeholder="https://www.exemplo.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", marginRight: "1rem", padding: "0.5rem" }}
      />
      <div style={{ margin: '1rem 0' }}>
        <label style={{ marginRight: '1rem' }}><input type="radio" value="emag" checked={runMode === 'emag'} onChange={e => setRunMode(e.target.value)} /> Apenas eMAG</label>
        <label style={{ marginRight: '1rem' }}><input type="radio" value="wcag" checked={runMode === 'wcag'} onChange={e => setRunMode(e.target.value)} /> Apenas WCAG (Axe-core)</label>
        <label><input type="radio" value="both" checked={runMode === 'both'} onChange={e => setRunMode(e.target.value)} /> Ambos</label>
      </div>
      <button onClick={testarUrl} disabled={carregando} style={{ padding: "0.5rem 1rem" }}>
        {carregando ? "Analisando..." : "Testar"}
      </button>

      {carregando && <p style={{marginTop: '1rem'}}>Isso pode levar alguns instantes...</p>}
      
      {resultados && groupedResults && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ backgroundColor: "#2c2c2c", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #444" }}>
            <h2 style={{ marginBottom: "1rem" }}>📊 Resumo da Avaliação</h2>
            <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
              {/* 3. EXIBE A NOVA PORCENTAGEM */}
              <li><strong>⭐ Porcentagem de Conformidade eMAG:</strong> {resumo.porcentagemEMAG}%</li>
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