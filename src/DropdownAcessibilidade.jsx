import React, { useState } from "react";

function DropdownAcessibilidade({ titulo, itens }) {
  const [aberto, setAberto] = useState(false);

  if (!itens || itens.length === 0) return null;

  const isError = titulo.includes("Erros");

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
              <li
                key={i}
                style={{
                  marginBottom: "2rem",
                  borderBottom: "1px solid #444",
                  paddingBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    color: "#4fc3f7",
                    wordBreak: "break-word",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {item.id} - {item.help}
                  </span>
                  {item.nodes && item.nodes.length > 0 && (
                    <span
                      style={{
                        marginLeft: "12px",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        backgroundColor: isError ? "#e53935" : "#ffb300",
                        color: "#ffffff",
                        fontSize: "0.9em",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.nodes.length}{" "}
                      {item.nodes.length > 1 ? "ocorrências" : "ocorrência"}
                    </span>
                  )}
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
                {item.nodes &&
                  item.nodes.map((node, j) => (
                    <DropdownNode key={j} node={node} />
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Componente DropdownNode atualizado para exibir todos os tipos de contexto
function DropdownNode({ node }) {
  const [aberto, setAberto] = useState(false);
  const checkData =
    node.any[0]?.data || node.all[0]?.data || node.none[0]?.data || null;

  return (
    <div style={{ marginBottom: "1rem", marginLeft: "1rem" }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          backgroundColor: "#444",
          color: "white",
          padding: "0.5rem 0.75rem",
          border: "1px solid #555",
          borderRadius: "0.5rem",
          width: "calc(100% - 1rem)",
          textAlign: "left",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Violação em: {node.target?.join(", ")} {aberto ? "▲" : "▼"}
      </button>

      {aberto && (
        <div
          style={{
            marginTop: "0.5rem",
            backgroundColor: "#1e1e1e",
            padding: "1rem",
            borderRadius: "0.5rem",
            border: "1px solid #555",
            overflowX: "auto",
            width: "calc(100% - 1rem)",
          }}
        >
          <p>
            <strong>Alvo:</strong>{" "}
            <code style={{ wordBreak: "break-all" }}>
              {node.target?.join(", ")}
            </code>
          </p>
          {node.failureSummary && (
            <p style={{ wordBreak: "break-word" }}>
              <strong>Resumo da Falha:</strong> {node.failureSummary}
            </p>
          )}

          {/* Bloco para a regra 3.5.11 (mesmo texto, URL diferente) */}
          {checkData && checkData.duplicates && (
            <div
              style={{
                marginTop: "1rem",
                borderTop: "1px solid #555",
                paddingTop: "1rem",
              }}
            >
              <strong>
                Links conflitantes encontrados (mesmo texto, URL diferente):
              </strong>
              <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                {checkData.duplicates.map((dup, k) => (
                  <li key={k}>
                    <pre
                      style={{
                        backgroundColor: "#111",
                        padding: "0.5rem",
                        borderRadius: "5px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {dup.html}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* NOVO BLOCO para a regra 3.5.10 (mesma URL, texto diferente) */}
          {checkData && checkData.conflictingLinks && (
            <div
              style={{
                marginTop: "1rem",
                borderTop: "1px solid #555",
                paddingTop: "1rem",
              }}
            >
              <strong>
                Links conflitantes encontrados (mesmo destino, texto diferente):
              </strong>
              <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                {checkData.conflictingLinks.map((link, k) => (
                  <li key={k}>
                    <pre
                      style={{
                        backgroundColor: "#111",
                        padding: "0.5rem",
                        borderRadius: "5px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {link.html}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* --- NOVO BLOCO PARA EXIBIR LANDMARKS FALTANTES --- */}
          {checkData && checkData.missing && (
            <div
              style={{
                marginTop: "1rem",
                borderTop: "1px solid #555",
                paddingTop: "1rem",
              }}
            >
              <strong>Landmarks recomendadas que estão faltando:</strong>
              <p
                style={{
                  marginTop: "0.5rem",
                  fontFamily: "monospace",
                  color: "#ffd54f",
                }}
              >
                {checkData.missing.join(", ")}
              </p>
            </div>
          )}

          {node.html &&
            !checkData?.duplicates &&
            !checkData?.conflictingLinks && (
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
      )}
    </div>
  );
}

export default DropdownAcessibilidade;
