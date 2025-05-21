import React, { useState } from "react";
import DropdownAcessibilidade from "./DropdownAcessibilidade";

function App() {
  const [url, setUrl] = useState("");
  const [resultados, setResultados] = useState(null);
  const [carregando, setCarregando] = useState(false);

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

  const renderSecao = (titulo, dados) => {
    if (!dados || dados.length === 0) return null;
    return (
      <div style={{ marginTop: "2rem" }}>
        <h2>{titulo}</h2>
        <ul>
          {dados.map((item, i) => (
            <li key={i}>
              <strong>{item.help}</strong>
              <p>{item.description}</p>
              {item.nodes && (
                <ul>
                  {item.nodes.map((node, j) => (
                    <li key={j}>
                      <>
                        <code>{node.target.join(", ")}</code>
                        {node.screenshot && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <img
                              src={node.screenshot}
                              alt="Screenshot do elemento"
                              style={{
                                maxWidth: "100%",
                                border: "2px solid red",
                                borderRadius: "8px",
                              }}
                            />
                          </div>
                        )}
                      </>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
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
        <>
          {renderSecao("❌ Violações (Erros)", resultados.violations)}
          {renderSecao("✅ Passaram", resultados.passes)}
          {renderSecao("❓ Incompletos", resultados.incomplete)}
          {renderSecao("🚫 Inaplicáveis", resultados.inapplicable)}
        </>
      )}
    </div>
  );
}

export default App;
