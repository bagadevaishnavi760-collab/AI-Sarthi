import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

// Shared Plotly config: responsive, consistent styling, refined tooltips.
export default function PlotlyChart({ data, layout = {}, style, onPointClick }) {
  const defaultLayout = {
    autosize: true,
    margin: { t: 25, r: 20, b: 50, l: 55 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
      color: '#334155',
      size: 11,
    },
    hoverlabel: {
      bgcolor: '#0F2745',
      font: { color: '#FFFFFF', family: 'Inter, sans-serif', size: 12 },
      bordercolor: '#1E3A5F',
    },
    colorway: ['#0F2745', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#C2410C', '#06B6D4'],
    xaxis: {
      gridcolor: '#F1F5F9',
      zerolinecolor: '#E2E8F0',
      tickfont: { size: 11, color: '#64748B' },
      ...layout.xaxis,
    },
    yaxis: {
      gridcolor: '#F1F5F9',
      zerolinecolor: '#E2E8F0',
      tickfont: { size: 11, color: '#64748B' },
      ...layout.yaxis,
    },
    legend: {
      orientation: 'h',
      y: -0.18,
      x: 0,
      font: { size: 11, color: '#64748B' },
      ...layout.legend,
    },
    ...layout,
  };

  return (
    <Plot
      data={data}
      onClick={onPointClick ? (e) => onPointClick(e.points?.[0]) : undefined}
      layout={defaultLayout}
      style={{ width: '100%', height: '100%', minHeight: 320, ...style }}
      config={{ responsive: true, displayModeBar: false }}
      useResizeHandler
    />
  );
}
