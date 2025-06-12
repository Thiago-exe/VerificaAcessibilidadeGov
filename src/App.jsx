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


function App() {
  const [url, setUrl] = useState("");
  const [resultados, setResultados] = useState(null);
  const [carregando, setCarregando] = useState(false);
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
        body: JSON.stringify({ url }),
      });
      const dados = await resposta.json();
      setResultados(dados);
      setActiveTab(Object.keys(CATEGORIAS_EMAG)[0]); 
    } catch (erro) {
      alert("Erro ao analisar a URL");
      console.error(erro);
    }
    setCarregando(false);
  };

  const groupedResults = useMemo(() => groupResultsByCategory(resultados), [resultados]);

  const calcularResumo = () => {
    if (!resultados) return {};
    const erros = resultados.violations?.length || 0;
    const avisos = resultados.incomplete?.length || 0;
    const aprovadas = resultados.passes?.length || 0;
    const inaplicaveis = resultados.inapplicable?.length || 0;

    const totalAvaliadas = erros + avisos + aprovadas + inaplicaveis;
    const porcentagemAprovacao =
      totalAvaliadas > 0
        ? ((aprovadas / (totalAvaliadas - inaplicaveis)) * 100).toFixed(2)
        : "0.00";

    return {
      erros,
      avisos,
      aprovadas,
      inaplicaveis,
      totalAvaliadas,
      porcentagemAprovacao,
    };
  };

  const resumo = calcularResumo();
  
  const tabOrder = [...Object.keys(CATEGORIAS_EMAG), 'Outros'];


  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#1e1e1e",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>Teste de Acessibilidade eMAG</h1>
      <input
        type="text"
        placeholder="https://www.exemplo.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", marginRight: "1rem", padding: "0.5rem" }}
      />
      <button onClick={testarUrl} disabled={carregando} style={{ padding: "0.5rem 1rem" }}>
        {carregando ? "Analisando..." : "Testar"}
      </button>

      {carregando && <p style={{marginTop: '1rem'}}>Isso pode levar alguns instantes...</p>}

      {resultados && groupedResults && (
        <div style={{ marginTop: "2rem" }}>
          {/* PAINEL DE RESUMO */}
          <div
            style={{
              backgroundColor: "#2c2c2c",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "2rem",
              border: "1px solid #444",
            }}
          >
            <h2 style={{ marginBottom: "1rem" }}>📊 Resumo da Avaliação</h2>
            <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
              <li><strong>Total de Regras Avaliadas:</strong> {resumo.totalAvaliadas}</li>
              <li><strong>✅ Aprovadas:</strong> {resumo.aprovadas}</li>
              <li><strong>❌ Erros:</strong> {resumo.erros}</li>
              <li><strong>⚠️ Avisos:</strong> {resumo.avisos}</li>
              <li><strong>🚫 Inaplicáveis:</strong> {resumo.inaplicaveis}</li>
              <li><strong>📈 Porcentagem de Aprovação:</strong> {resumo.porcentagemAprovacao}%</li>
            </ul>
          </div>

          {/* NAVEGAÇÃO POR ABAS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {tabOrder.map(tabName => {
              const tabData = groupedResults[tabName];
              const hasContent = tabData && (tabData.violations.length > 0 || tabData.incomplete.length > 0 || tabData.passes.length > 0 || tabData.inapplicable.length > 0);
              
              if (!hasContent) return null;

              return (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === tabName ? '#4fc3f7' : '#ccc',
                    borderBottom: activeTab === tabName ? '3px solid #4fc3f7' : '3px solid transparent',
                    fontSize: '1rem',
                    fontWeight: activeTab === tabName ? 'bold' : 'normal',
                    transition: 'color 0.2s, border-bottom 0.2s',
                  }}
                >
                  {tabName}
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DA ABA ATIVA */}
          <div>
            {groupedResults[activeTab] && (
              <>
                <DropdownAcessibilidade
                  titulo="❌ Erros"
                  // AQUI ESTÁ A MUDANÇA PRINCIPAL!
                  // Aplicamos o filtro apenas se a aba não for 'Outros'.
                  itens={
                    activeTab === 'Outros'
                      ? groupedResults[activeTab].violations
                      : filtrarRegrasEmag(groupedResults[activeTab].violations)
                  }
                />
                <DropdownAcessibilidade
                  titulo="⚠️ Avisos"
                  itens={groupedResults[activeTab].incomplete}
                />
                <DropdownAcessibilidade
                  titulo="✅ Aprovadas"
                  itens={groupedResults[activeTab].passes}
                />
                <DropdownAcessibilidade
                  titulo="🚫 Inaplicáveis"
                  itens={groupedResults[activeTab].inapplicable}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;