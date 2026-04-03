"use client";

import { useId, useMemo } from "react";

type ChartFrameProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

type NeonSeries = {
  id: string;
  label: string;
  color: string;
  values: number[];
};

type NeonAreaChartProps = {
  title?: string;
  description?: string;
  labels: string[];
  series: NeonSeries[];
  height?: number;
  className?: string;
};

type SegmentRingGaugeProps = {
  label: string;
  value: number;
  max?: number;
  tone?: "cyan" | "emerald" | "amber" | "violet" | "rose";
  note?: string;
  subLabel?: string;
  color?: string;
  size?: number;
};

type RadarAxis = {
  label: string;
  value: number;
  max?: number;
};

type RadarPulseChartProps = {
  title?: string;
  description?: string;
  axes: RadarAxis[];
  size?: number;
};

type MatrixHeatmapMiniProps = {
  title?: string;
  description?: string;
  rows: string[];
  columns: string[];
  values: number[][];
  minLabel?: string;
  maxLabel?: string;
};

type TelemetryBarItem = {
  label: string;
  value: number;
  target?: number;
  tone?: "ok" | "warn" | "danger" | "error" | "neutral";
};

type TelemetryBarsProps = {
  title?: string;
  description?: string;
  items: TelemetryBarItem[];
};

type ConduitStage = {
  label: string;
  status: "ok" | "warn" | "error" | "idle";
  detail?: string;
  note?: string;
};

type ConduitFlowLineProps = {
  title?: string;
  description?: string;
  stages: ConduitStage[];
};

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function toValueList(series: NeonSeries[]): number[] {
  return series.flatMap((item) => item.values);
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function chartPoint(index: number, count: number, width: number, padding: number): number {
  if (count <= 1) return padding;
  return padding + (index / (count - 1)) * (width - padding * 2);
}

function colorForHeat(value: number): string {
  const alpha = clamp(value, 0, 100) / 100;
  if (alpha > 0.75) return `rgba(244,63,94,${0.24 + alpha * 0.54})`;
  if (alpha > 0.45) return `rgba(245,158,11,${0.2 + alpha * 0.46})`;
  return `rgba(34,211,238,${0.18 + alpha * 0.4})`;
}

function toneToColor(tone: TelemetryBarItem["tone"]): string {
  if (tone === "ok") return "#34d399";
  if (tone === "warn") return "#f59e0b";
  if (tone === "danger" || tone === "error") return "#fb7185";
  return "#60a5fa";
}

function stageTone(stage: ConduitStage["status"]): string {
  if (stage === "ok") return "border-emerald-400/70 bg-emerald-500/20 text-emerald-100";
  if (stage === "warn") return "border-amber-400/70 bg-amber-500/20 text-amber-100";
  if (stage === "error") return "border-rose-400/70 bg-rose-500/20 text-rose-100";
  return "border-slate-400/60 bg-slate-500/20 text-slate-100";
}

function ChartFrame({ title, description, children, footer }: ChartFrameProps) {
  return (
    <section className="space-y-3" aria-label={title || "chart"}>
      {title ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {description ? <p className="text-xs text-[var(--text-secondary)]">{description}</p> : null}
        </div>
      ) : null}
      {children}
      {footer ? <div>{footer}</div> : null}
    </section>
  );
}

export function NeonAreaChart({ title, description, labels, series, height = 220, className }: NeonAreaChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const prepared = useMemo(() => {
    const width = 760;
    const padding = 28;
    const values = toValueList(series);
    const safeMax = values.length > 0 ? Math.max(...values, 1) : 1;

    const mapped = series.map((item) => {
      const points = item.values.map((value, index) => {
        const x = chartPoint(index, Math.max(item.values.length, 2), width, padding);
        const y = height - padding - (clamp(value, 0, safeMax) / safeMax) * (height - padding * 2);
        return `${x},${y}`;
      });

      const area = [
        `${padding},${height - padding}`,
        ...points,
        `${width - padding},${height - padding}`
      ].join(" ");

      return {
        ...item,
        points: points.join(" "),
        area,
        latest: item.values[item.values.length - 1] ?? 0
      };
    });

    const axisY = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = height - padding - ratio * (height - padding * 2);
      const value = Math.round(ratio * safeMax);
      return { y, value };
    });

    return { width, padding, mapped, axisY, safeMax };
  }, [height, series]);

  if (series.length === 0 || !series.some((item) => item.values.length > 0)) {
    return (
      <ChartFrame title={title} description={description}>
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
          No signal data yet.
        </div>
      </ChartFrame>
    );
  }

  return (
    <div className={className}>
      <ChartFrame
      title={title}
      description={description}
      footer={
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          {prepared.mapped.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              {item.label}: {formatCompact(item.latest)}
            </span>
          ))}
        </div>
      }
      >
        <div className="rounded-xl border border-[color:var(--shell-border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.08),transparent)] p-2">
        <svg
          viewBox={`0 0 ${prepared.width} ${height}`}
          className="h-[220px] w-full"
          role="img"
          aria-label={title || "area chart"}
        >
          <defs>
            {prepared.mapped.map((item) => (
              <linearGradient key={`${item.id}-gradient`} id={`${gradientId}-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.42" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {prepared.axisY.map((tick) => (
            <g key={`y-${tick.y}`}>
              <line
                x1={prepared.padding}
                y1={tick.y}
                x2={prepared.width - prepared.padding}
                y2={tick.y}
                stroke="rgba(148,163,184,0.28)"
                strokeDasharray="4 6"
              />
              <text x={6} y={tick.y + 4} fontSize="10" fill="currentColor" opacity="0.7">
                {tick.value}
              </text>
            </g>
          ))}

          {prepared.mapped.map((item) => (
            <g key={item.id}>
              <polygon points={item.area} fill={`url(#${gradientId}-${item.id})`} />
              <polyline
                points={item.points}
                fill="none"
                stroke={item.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {labels.length > 0
            ? labels.map((label, index) => {
                if (index % Math.ceil(labels.length / 6) !== 0 && index !== labels.length - 1) return null;
                const x = chartPoint(index, Math.max(labels.length, 2), prepared.width, prepared.padding);
                return (
                  <text key={`${label}-${index}`} x={x} y={height - 6} fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.7">
                    {label}
                  </text>
                );
              })
            : null}
        </svg>
        </div>
      </ChartFrame>
    </div>
  );
}

export function SegmentRingGauge({
  label,
  value,
  max = 100,
  tone = "cyan",
  note,
  subLabel,
  color,
  size = 132
}: SegmentRingGaugeProps) {
  const safeValue = clamp(value, 0, max);
  const ratio = max > 0 ? safeValue / max : 0;
  const radius = size * 0.34;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = `${ratio * circumference} ${circumference}`;

  const toneColor =
    color ??
    (tone === "emerald"
      ? "#34d399"
      : tone === "amber"
        ? "#f59e0b"
        : tone === "violet"
          ? "#a78bfa"
          : tone === "rose"
            ? "#fb7185"
            : "#22d3ee");

  return (
    <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-2.5" role="group" aria-label={`${label} gauge`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[110px] w-[110px]">
        <circle cx={center} cy={center} r={radius} stroke="rgba(148,163,184,0.25)" strokeWidth="12" fill="none" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={toneColor}
          strokeWidth="12"
          strokeDasharray={dash}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <p className="-mt-16 text-center font-mono text-xl font-semibold text-[var(--text-primary)]">{Math.round(safeValue)}</p>
      <p className="mt-8 text-center text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
      {subLabel ? <p className="mt-1 text-center text-[11px] text-[var(--text-muted)]">{subLabel}</p> : null}
      {note ? <p className="mt-1 text-center text-[11px] text-[var(--text-muted)]">{note}</p> : null}
    </div>
  );
}

export function RadarPulseChart({ title, description, axes, size = 280 }: RadarPulseChartProps) {
  const count = Math.max(axes.length, 3);
  const center = size / 2;
  const radius = size * 0.32;

  const points = axes.map((axis, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const max = Math.max(axis.max ?? 100, 1);
    const ratio = clamp(axis.value, 0, max) / max;
    const x = center + Math.cos(angle) * radius * ratio;
    const y = center + Math.sin(angle) * radius * ratio;
    const labelX = center + Math.cos(angle) * (radius + 26);
    const labelY = center + Math.sin(angle) * (radius + 26);
    return { x, y, labelX, labelY, label: axis.label };
  });

  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <ChartFrame title={title} description={description}>
      <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-2">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-[260px] w-full" role="img" aria-label={title || "radar chart"}>
          {[1, 0.75, 0.5, 0.25].map((step) => {
            const ring = axes
              .map((_, index) => {
                const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
                const x = center + Math.cos(angle) * radius * step;
                const y = center + Math.sin(angle) * radius * step;
                return `${x},${y}`;
              })
              .join(" ");
            return <polygon key={step} points={ring} fill="none" stroke="rgba(148,163,184,0.24)" strokeWidth="1" />;
          })}

          {points.map((point, index) => (
            <line key={`axis-${index}`} x1={center} y1={center} x2={point.labelX} y2={point.labelY} stroke="rgba(148,163,184,0.24)" />
          ))}

          <polygon points={polygon} fill="rgba(34,211,238,0.28)" stroke="#22d3ee" strokeWidth="2" />
          {points.map((point, index) => (
            <g key={`point-${index}`}>
              <circle cx={point.x} cy={point.y} r="4" fill="#22d3ee" />
              <text x={point.labelX} y={point.labelY} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.86">
                {point.label}
              </text>
            </g>
          ))}

          <circle cx={center} cy={center} r="5" fill="#22d3ee" className="animate-pulse" />
        </svg>
      </div>
    </ChartFrame>
  );
}

export function MatrixHeatmapMini({
  title,
  description,
  rows,
  columns,
  values,
  minLabel = "Lower",
  maxLabel = "Higher"
}: MatrixHeatmapMiniProps) {
  if (rows.length === 0 || columns.length === 0) {
    return (
      <ChartFrame title={title} description={description}>
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
          No matrix data.
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title={title}
      description={description}
      footer={
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      }
    >
      <div className="overflow-auto rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-2">
        <table className="w-full border-separate border-spacing-1.5 text-[11px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-[var(--text-muted)]" />
              {columns.map((column) => (
                <th key={column} className="px-2 py-1 text-left font-medium text-[var(--text-muted)]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row}>
                <th className="whitespace-nowrap px-2 py-1 text-left font-medium text-[var(--text-secondary)]">{row}</th>
                {columns.map((column, columnIndex) => {
                  const value = values[rowIndex]?.[columnIndex] ?? 0;
                  return (
                    <td key={`${row}-${column}`}>
                      <div
                        className="rounded-md border border-white/10 px-2 py-1 text-right font-mono text-[var(--text-primary)]"
                        style={{ backgroundColor: colorForHeat(value) }}
                        aria-label={`${row} ${column} ${Math.round(value)}`}
                      >
                        {Math.round(value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}

export function TelemetryBars({ title, description, items }: TelemetryBarsProps) {
  const max = Math.max(
    ...items.flatMap((item) => [item.value, item.target ?? 0]),
    1
  );

  if (items.length === 0) {
    return (
      <ChartFrame title={title} description={description}>
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
          No telemetry data.
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={title} description={description}>
      <div className="space-y-2 rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
        {items.map((item) => {
          const ratio = clamp(item.value, 0, max) / max;
          const targetRatio = clamp(item.target ?? 0, 0, max) / max;
          const color = toneToColor(item.tone);
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {Math.round(item.value)}
                  {item.target !== undefined ? <span className="text-[var(--text-muted)]"> / {Math.round(item.target)}</span> : null}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-200/45 dark:bg-slate-700/40">
                {item.target !== undefined ? (
                  <span
                    className="absolute inset-y-0 w-px bg-white/70 dark:bg-slate-100/80"
                    style={{ left: `${targetRatio * 100}%` }}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}

export function ConduitFlowLine({ title, description, stages }: ConduitFlowLineProps) {
  if (stages.length === 0) {
    return (
      <ChartFrame title={title} description={description}>
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[color:var(--shell-border)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
          No pipeline stages.
        </div>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame title={title} description={description}>
      <div className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {stages.map((stage, index) => (
            <div key={`${stage.label}-${index}`} className="flex items-center gap-2">
              <div className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${stageTone(stage.status)}`}>
                <p>{stage.label}</p>
                {stage.note || stage.detail ? <p className="mt-0.5 text-[10px] opacity-85">{stage.note ?? stage.detail}</p> : null}
              </div>
              {index < stages.length - 1 ? (
                <div className="relative h-[2px] w-7 overflow-hidden rounded bg-cyan-400/25">
                  <span className="absolute inset-y-0 left-0 w-1/2 animate-pulse bg-cyan-300/80" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}
