import type { ReactNode } from "react";

   
                                                              
                                                               
                                                             
                                                               
  
                                                              
                                                            
                                                                
   

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
                                                                      
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="aura-md-code-inline">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            className="aura-md-link"
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function renderAuraMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

                        
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;                      
      blocks.push(
        <pre key={`b${blockKey++}`} className="aura-md-pre">
          <code data-lang={lang}>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

              
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = (level === 1 ? "h3" : level === 2 ? "h4" : "h5") as
        | "h3"
        | "h4"
        | "h5";
      blocks.push(
        <Tag key={`b${blockKey++}`} className={`aura-md-h aura-md-h${level}`}>
          {renderInline(headingMatch[2], `h${blockKey}`)}
        </Tag>
      );
      i++;
      continue;
    }

                 
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={`b${blockKey++}`} className="aura-md-quote">
          {renderInline(quoteLines.join(" "), `q${blockKey}`)}
        </blockquote>
      );
      continue;
    }

            
    if (line.includes("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const headerCells = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={`b${blockKey++}`} className="aura-md-table-wrap">
          <table className="aura-md-table">
            <thead>
              <tr>
                {headerCells.map((cell, ci) => (
                  <th key={ci}>{renderInline(cell, `th${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{renderInline(cell, `td${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

                     
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`b${blockKey++}`} className="aura-md-ul">
          {items.map((item, ii) => (
            <li key={ii} className="aura-md-li">
              {renderInline(item, `ul${blockKey}-${ii}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

                   
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`b${blockKey++}`} className="aura-md-ol">
          {items.map((item, ii) => (
            <li key={ii} className="aura-md-li">
              {renderInline(item, `ol${blockKey}-${ii}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

                                                 
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={`b${blockKey++}`} className="aura-md-p">
        {renderInline(paraLines.join(" "), `p${blockKey}`)}
      </p>
    );
  }

  return blocks;
}
