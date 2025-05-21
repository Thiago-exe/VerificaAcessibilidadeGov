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
          }}
        >
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {itens.map((item, i) => (
              <li key={i} style={{ marginBottom: "1rem" }}>
                <strong>{item.help}</strong>
                <p>{item.description}</p>
                {item.nodes && (
                  <ul>
                    {item.nodes.map((node, j) => (
                      <li key={j} style={{ marginTop: "0.5rem" }}>
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
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DropdownAcessibilidade;
