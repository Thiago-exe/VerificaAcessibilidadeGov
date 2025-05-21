import React, { useState } from "react";

function DropdownAcessibilidade({ titulo, itens, cor }) {
  const [aberto, setAberto] = useState(false);

  if (!itens || itens.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "0.75rem 1rem",
          border: "none",
          borderRadius: "0.5rem",
          width: "100%",
          textAlign: "left",
          fontSize: "1.1rem",
          cursor: "pointer",
        }}
      >
        {titulo} ({itens.length}) {aberto ? "▲" : "▼"}
      </button>

      {aberto && (
        <div
          style={{
            marginTop: "0.5rem",
            backgroundColor: "#2b2b2b",
            padding: "1rem",
            borderRadius: "0.5rem",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {itens.map((item, i) => (
              <li key={i} style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#4fc3f7", wordBreak: "break-word" }}>
                  {item.id} - {item.help}
                </h3>
                <p style={{ wordBreak: "break-word" }}>
                  <strong>Descrição:</strong> {item.description}
                </p>
                <p>
                  <strong>Impacto:</strong> {item.impact}
                </p>
                <p>
                  <strong>Ajuda:</strong>{" "}
                  <a
                    href={item.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#81d4fa", wordBreak: "break-all" }}
                  >
                    {item.helpUrl}
                  </a>
                </p>

                {item.tags?.length > 0 && (
                  <p>
                    <strong>Tags:</strong> {item.tags.join(", ")}
                  </p>
                )}

                {item.nodes &&
                  item.nodes.map((node, j) => (
                    <div
                      key={j}
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#1e1e1e",
                        borderRadius: "0.5rem",
                        border: "1px solid #444",
                        overflowX: "auto",
                      }}
                    >
                      <p>
                        <strong>Alvo:</strong>{" "}
                        <code style={{ wordBreak: "break-all" }}>
                          {node.target.join(", ")}
                        </code>
                      </p>

                      {node.failureSummary && (
                        <p style={{ wordBreak: "break-word" }}>
                          <strong>Resumo da Falha:</strong>{" "}
                          {node.failureSummary}
                        </p>
                      )}

                      {node.html && (
                        <div>
                          <strong>HTML:</strong>
                          <pre
                            style={{
                              backgroundColor: "#111",
                              padding: "0.5rem",
                              borderRadius: "5px",
                              overflowX: "auto",
                              marginTop: "0.5rem",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {node.html}
                          </pre>
                        </div>
                      )}

                      {node.any?.length > 0 && (
                        <div>
                          <strong>Um ou mais dos quesitos a seguir não foi cumprido:</strong>
                          <ul>
                            {node.any.map((check, k) => (
                              <li key={k}>{check.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {node.all?.length > 0 && (
                        <div>
                          <strong>Todos os quesitos a seguir devem ser cumpridos:</strong>
                          <ul>
                            {node.all.map((check, k) => (
                              <li key={k}>{check.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {node.none?.length > 0 && (
                        <div>
                          <strong>Nenhum dos quesitos a seguir é aprovado:</strong>
                          <ul>
                            {node.none.map((check, k) => (
                              <li key={k}>{check.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DropdownAcessibilidade;
