import { memo, useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    Plotly: any;
  }
}

interface PlotlyChartProps {
  id: string;
  data: any[];
  layout: Record<string, any>;
  config?: Record<string, any>;
}

const DEFAULT_CONFIG: Record<string, any> = {
  responsive: true,
  displayModeBar: false,
};

function PlotlyChart({ id, data, layout, config }: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedConfig = useMemo(() => config ?? DEFAULT_CONFIG, [config]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !window.Plotly) return;

    // Create the plot
    window.Plotly.newPlot(el, data, {
      ...layout,
      autosize: true,
      margin: { l: 50, r: 20, t: 30, b: 40, ...(layout.margin || {}) },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
    }, resolvedConfig);

    // Set up ResizeObserver to responsive redraw
    const resizeObserver = new ResizeObserver(() => {
      if (window.Plotly && el) {
        window.Plotly.Plots.resize(el);
      }
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      if (window.Plotly && el) {
        window.Plotly.purge(el);
      }
    };
  }, [data, layout, resolvedConfig]);

  return (
    <div className="w-full relative min-h-[350px]">
      {!window.Plotly && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-sm">
          Loading Plotly engine...
        </div>
      )}
      <div id={id} ref={containerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}

export default memo(PlotlyChart);
