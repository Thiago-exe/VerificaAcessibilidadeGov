import React, { useState } from "react";
import DropdownAcessibilidade from "./DropdownAcessibilidade";

function App() {
  const [url, setUrl] = useState("");
  const [resultados, setResultados] = useState(null);
  const [carregando, setCarregando] = useState(false);

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
    } catch (erro) {
      alert("Erro ao analisar a URL");
    }
    setCarregando(false);
  };

  const calcularResumo = () => {
    const erros = resultados.violations?.length || 0;
    const avisos = resultados.incomplete?.length || 0;
    const aprovadas = resultados.passes?.length || 0;
    const inaplicaveis = resultados.inapplicable?.length || 0;

    const totalAvaliadas = erros + avisos + aprovadas + inaplicaveis;
    const porcentagemAprovacao =
      totalAvaliadas > 0
        ? ((aprovadas / (totalAvaliadas-inaplicaveis)) * 100).toFixed(2)
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

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#1e1e1e",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>Teste de Acessibilidade</h1>
      <input
        type="text"
        placeholder="https://www.exemplo.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", marginRight: "1rem", padding: "0.5rem" }}
      />
      <button onClick={testarUrl} style={{ padding: "0.5rem 1rem" }}>
        Testar
      </button>

      {carregando && <p>Analisando...</p>}

      {resultados && (
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
            {(() => {
              const resumo = calcularResumo();
              return (
                <ul style={{ listStyle: "none", padding: 0, lineHeight: "1.8" }}>
                  <li><strong>Total de Regras Avaliadas:</strong> {resumo.totalAvaliadas}</li>
                  <li><strong>✅ Aprovadas:</strong> {resumo.aprovadas}</li>
                  <li><strong>❌ Erros:</strong> {resumo.erros}</li>
                  <li><strong>⚠️ Avisos:</strong> {resumo.avisos}</li>
                  <li><strong>🚫 Inaplicáveis:</strong> {resumo.inaplicaveis}</li>
                  <li><strong>📈 Porcentagem de Aprovação:</strong> {resumo.porcentagemAprovacao}%</li>
                </ul>
              );
            })()}
          </div>

          {/* LISTAS */}
          <DropdownAcessibilidade
            titulo="❌ Erros"
            itens={filtrarRegrasEmag(resultados.violations)}
            cor="bg-red-100 text-red-800"
          />
          <DropdownAcessibilidade
            titulo="⚠️ Avisos"
            itens={resultados.incomplete}
            cor="bg-yellow-100 text-yellow-800"
          />
          <DropdownAcessibilidade
            titulo="✅ Aprovadas"
            itens={resultados.passes}
            cor="bg-green-100 text-green-800"
          />
          <DropdownAcessibilidade
            titulo="🚫 Inaplicáveis"
            itens={resultados.inapplicable}
            cor="bg-gray-100 text-gray-800"
          />
        </div>
      )}
    </div>
  );
}

export default App;
