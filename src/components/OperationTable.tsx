import { Fragment } from "react";
import { OPERATIONS, STAGES, STAGE_NAME, type Operation, type Segment } from "../lib/operations";

/** Single-letter variables in math segments are italic, as in the paper's LaTeX. */
function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split(/([A-Za-zπ])/).map((part, i) =>
        /^[A-Za-zπ]$/.test(part) ? <i key={i}>{part}</i> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

function Example({ op }: { op: Operation }) {
  return (
    <>
      {op.example.map((seg: Segment, i) => {
        const body = seg.math ? <MathText text={seg.t} /> : seg.t;
        return seg.hl ? (
          <strong key={i} className="ex-hl" style={{ color: op.textColor ?? op.color }}>
            {body}
          </strong>
        ) : (
          <Fragment key={i}>{body}</Fragment>
        );
      })}
    </>
  );
}

/** Table 1 of the paper, with the annotation-guideline definition under each operation. */
export function OperationTable() {
  return (
    <figure className="figure ops-figure">
      <table className="ops-table">
        <thead>
          <tr>
            <th scope="col">Problem-solving stage</th>
            <th scope="col">Reasoning operation</th>
            <th scope="col">Example</th>
          </tr>
        </thead>
        {STAGES.map((stage) => {
          const ops = OPERATIONS.filter((o) => o.stage === stage);
          return (
            <tbody key={stage}>
              {ops.map((op, i) => (
                <tr key={op.label}>
                  {i === 0 && (
                    <th scope="rowgroup" rowSpan={ops.length} className="ops-stage">
                      {STAGE_NAME[stage]}
                    </th>
                  )}
                  <td className="ops-op">
                    <span className="ops-name" style={{ color: op.textColor ?? op.color }}>
                      <span className="ops-swatch" style={{ background: op.color }} aria-hidden="true" />
                      {op.name}
                    </span>
                    <span className="ops-def">{op.definition}</span>
                  </td>
                  <td className="ops-ex">
                    <Example op={op} />
                  </td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </figure>
  );
}
