import { useMemo, useRef } from "react";
import { SelectField } from "@/components/field";
import { TabHeader } from "@/components/headline";
import type { AxisKey } from "@/lib/calc/types";
import {
  AXIS_LABEL,
  AXIS_UNIT,
  axisValues,
  buildGrid,
  currentAxisValue,
  nearestIndex,
} from "@/lib/calc/sensitivity";
import { fromApp } from "@/lib/calc/fees";
import { cn, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

const AXES: AxisKey[] = [
  "grossAlpha",
  "totalFeeLoad",
  "volatility",
  "netExposure",
  "borrowCost",
  "holdingPeriod",
];

function cellLabel(n: number) {
  return n.toFixed(1);
}

export function SensitivityTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const input = fromApp(p);
  const grid = useMemo(() => buildGrid(input, p.gridX, p.gridY), [input, p.gridX, p.gridY]);
  const xs = axisValues(p.gridX);
  const ys = axisValues(p.gridY);
  const hiX = nearestIndex(xs, currentAxisValue(input, p.gridX));
  const hiY = nearestIndex(ys, currentAxisValue(input, p.gridY));
  const current = grid[hiY]?.[hiX];

  return (
    <div className="space-y-5">
      <section ref={rootRef} className="space-y-5">
        <TabHeader
          kicker="Tab 2 · Sensitivity grid"
          text={
            current
              ? `Break-even alpha is ${formatPct(current.breakEven)} at your settings`
              : "Break-even alpha across the book"
          }
          filename="sensitivity-grid.png"
          targetRef={rootRef}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Rows"
            value={p.gridY}
            onChange={(v) => p.setAxes(p.gridX, v)}
            options={AXES.map((k) => ({ value: k, label: AXIS_LABEL[k] }))}
          />
          <SelectField
            label="Columns"
            value={p.gridX}
            onChange={(v) => p.setAxes(v, p.gridY)}
            options={AXES.map((k) => ({ value: k, label: AXIS_LABEL[k] }))}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-center">
            <thead>
              <tr>
                <th className="text-muted w-28 pr-2 text-left font-ui text-sm font-medium tracking-wide">
                  {AXIS_LABEL[p.gridY]} \ {AXIS_LABEL[p.gridX]}
                </th>
                {xs.map((x) => (
                  <th key={x} className="tabular text-muted px-0.5 pb-2 font-ui text-sm font-medium">
                    {x}
                    {AXIS_UNIT[p.gridX] === "%" ? "%" : AXIS_UNIT[p.gridX] === "×" ? "×" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ys.map((y, yi) => (
                <tr key={y}>
                  <th className="tabular pr-2 text-left font-ui text-sm font-semibold text-navy">
                    {y}
                    {AXIS_UNIT[p.gridY] === "%" ? "%" : AXIS_UNIT[p.gridY] === "yr" ? "y" : ""}
                  </th>
                  {grid[yi].map((cell, xi) => {
                    const on = xi === hiX && yi === hiY;
                    return (
                      <td key={`${xi}-${yi}`} className="p-0.5">
                        <div
                          className={cn(
                            "flex h-11 items-center justify-center rounded-xs text-sm font-semibold tabular",
                            cell.tone === "win" && "bg-win text-cream",
                            cell.tone === "lose" && "bg-ox text-cream",
                            cell.tone === "near" && "bg-gold text-navy",
                            on && "ring-2 ring-navy ring-offset-1 ring-offset-paper",
                          )}
                          title={`Break-even ${cell.breakEven.toFixed(2)}% · spread ${cell.spread.toFixed(2)}% · wealth ${cell.wealthRatio.toFixed(2)}×`}
                        >
                          {cellLabel(cell.breakEven)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-muted mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-xs bg-win" /> Hedge fund wins
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-xs bg-gold" /> Within 50 bps
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.5 rounded-xs bg-ox" /> Beta wins
          </span>
          <span>Cells show break-even alpha. Border marks the nearest cell to your Tab 1 book.</span>
        </div>
      </section>
    </div>
  );
}
