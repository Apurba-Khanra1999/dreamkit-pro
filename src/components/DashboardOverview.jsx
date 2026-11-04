import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Command, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Sparkles, 
  Cpu,
  Lock,
  Activity,
  BarChart3,
  PieChart,
  HardDrive,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  Check,
  FileCode2,
  FileText,
  Images,
  Binary
} from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '../config/toolsRegistry';

export default function DashboardOverview({ onSelectTool }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [activeMetricTab, setActiveMetricTab] = useState('throughput');
  const [activeDataPointIndex, setActiveDataPointIndex] = useState(null);

  // Tools stats
  const availableTools = useMemo(() => {
    return TOOLS_REGISTRY.filter(t => t.id !== 'dashboard' && t.id !== 'landing' && t.id !== 'login');
  }, []);

  const totalToolCount = availableTools.length;

  // Category counts
  const categoryStats = useMemo(() => {
    const counts = {
      json: availableTools.filter(t => t.category === 'json').length,
      media: availableTools.filter(t => t.category === 'media').length,
      pdf: availableTools.filter(t => t.category === 'pdf').length,
      encoders: availableTools.filter(t => t.category === 'encoders').length,
      analysis: availableTools.filter(t => t.category === 'analysis').length,
    };
    return [
      { id: 'json', label: 'Code & Formatters', count: counts.json, color: '#673DE6', pct: Math.round((counts.json / totalToolCount) * 100) },
      { id: 'media', label: 'Media & Creative', count: counts.media, color: '#EC4899', pct: Math.round((counts.media / totalToolCount) * 100) },
      { id: 'pdf', label: 'PDF & Documents', count: counts.pdf, color: '#F43F5E', pct: Math.round((counts.pdf / totalToolCount) * 100) },
      { id: 'encoders', label: 'Encoders & Converters', count: counts.encoders, color: '#F59E0B', pct: Math.round((counts.encoders / totalToolCount) * 100) },
      { id: 'analysis', label: 'Security & Analysis', count: counts.analysis, color: '#10B981', pct: Math.round((counts.analysis / totalToolCount) * 100) },
    ];
  }, [availableTools, totalToolCount]);

  // Filtered tools in directory
  const filteredTools = useMemo(() => {
    let list = availableTools;
    if (selectedCategory !== 'all') {
      list = list.filter(t => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableTools, selectedCategory, searchQuery]);

  // Chart dataset based on timeframe and metric
  const chartData = useMemo(() => {
    if (activeMetricTab === 'latency') {
      return [
        { label: '00:00', val: 0.28, display: '0.28 ms' },
        { label: '04:00', val: 0.22, display: '0.22 ms' },
        { label: '08:00', val: 0.35, display: '0.35 ms' },
        { label: '12:00', val: 0.19, display: '0.19 ms' },
        { label: '16:00', val: 0.24, display: '0.24 ms' },
        { label: '20:00', val: 0.18, display: '0.18 ms' },
        { label: '24:00', val: 0.15, display: '0.15 ms' },
      ];
    }
    if (activeMetricTab === 'memory') {
      return [
        { label: '00:00', val: 12.4, display: '12.4 MB' },
        { label: '04:00', val: 14.1, display: '14.1 MB' },
        { label: '08:00', val: 18.2, display: '18.2 MB' },
        { label: '12:00', val: 24.5, display: '24.5 MB' },
        { label: '16:00', val: 21.0, display: '21.0 MB' },
        { label: '20:00', val: 16.8, display: '16.8 MB' },
        { label: '24:00', val: 14.2, display: '14.2 MB' },
      ];
    }
    // Throughput (Ops/sec)
    return [
      { label: '00:00', val: 4200, display: '4.2k ops/s' },
      { label: '04:00', val: 6800, display: '6.8k ops/s' },
      { label: '08:00', val: 11400, display: '11.4k ops/s' },
      { label: '12:00', val: 18200, display: '18.2k ops/s' },
      { label: '16:00', val: 15400, display: '15.4k ops/s' },
      { label: '20:00', val: 12900, display: '12.9k ops/s' },
      { label: '24:00', val: 17800, display: '17.8k ops/s' },
    ];
  }, [activeMetricTab]);

  // Compute SVG Area path
  const chartSvgPath = useMemo(() => {
    const width = 760;
    const height = 220;
    const paddingX = 40;
    const paddingY = 25;
    const drawWidth = width - paddingX * 2;
    const drawHeight = height - paddingY * 2;

    const values = chartData.map(d => d.val);
    const minVal = Math.min(...values) * 0.85;
    const maxVal = Math.max(...values) * 1.15;
    const valRange = maxVal - minVal || 1;

    const points = chartData.map((d, i) => {
      const x = paddingX + (i / (chartData.length - 1)) * drawWidth;
      const y = height - paddingY - ((d.val - minVal) / valRange) * drawHeight;
      return { x, y, data: d };
    });

    // Build smooth bezier curve
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpX = (current.x + next.x) / 2;
      pathD += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { pathD, areaD, points, width, height, paddingX, paddingY };
  }, [chartData]);

  // SVG Donut calculation
  const donutSegments = useMemo(() => {
    let cumulative = 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius; // ~339.29

    return categoryStats.map((cat) => {
      const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -cumulative * (circumference / 100);
      cumulative += cat.pct;
      return {
        ...cat,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [categoryStats]);

  return (
    <div className="space-y-8 animate-fade-in pb-16 select-none max-w-7xl mx-auto">
      
      {/* ========================================================= */}
      {/* TOP HERO: Minimalist Modern SaaS Header                   */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#673DE6]/10 text-[#673DE6] dark:text-[#A78BFA] border border-[#673DE6]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#673DE6] animate-pulse" />
            <span>Developer Studio Benchmark</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-300">100% Client-Side Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Workspace Overview & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Real-time browser benchmarks, WASM execution velocity, and suite directory. Instantaneous computation without cloud dependency.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelectTool('formatter')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#673DE6] hover:bg-[#5b32d4] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch Formatter</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('pdf_compressor')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/[0.08] shadow-2xs transition-all cursor-pointer"
          >
            <span>PDF Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 MODERN KPI METRIC CARDS WITH INLINE SPARKLINE CHARTS    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Daily Executions
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +18.4%
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              48,219
            </span>
            <span className="text-[11px] text-slate-400 font-medium">ops today</span>
          </div>
          {/* Emerald Micro Sparkline */}
          <div className="h-9 w-full mt-1">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path
                d="M 0 25 Q 15 24, 25 18 T 50 15 T 75 8 T 100 4"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 25 Q 15 24, 25 18 T 50 15 T 75 8 T 100 4 L 100 30 L 0 30 Z"
                fill="url(#emeraldSparkGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="emeraldSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Latency
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#673DE6] dark:text-[#A78BFA] bg-[#673DE6]/10 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              Instant
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              0.24 ms
            </span>
            <span className="text-[11px] text-slate-400 font-medium">zero network lag</span>
          </div>
          {/* Purple Micro Sparkline */}
          <div className="h-9 w-full mt-1">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path
                d="M 0 12 Q 20 22, 40 8 T 70 14 T 100 5"
                fill="none"
                stroke="#673DE6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 12 Q 20 22, 40 8 T 70 14 T 100 5 L 100 30 L 0 30 Z"
                fill="url(#purpleSparkGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="purpleSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#673DE6" />
                  <stop offset="100%" stopColor="#673DE6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Client Data Shield
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              100% Isolated
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              0 Bytes
            </span>
            <span className="text-[11px] text-slate-400 font-medium">sent externally</span>
          </div>
          {/* Cyan Micro Sparkline */}
          <div className="h-9 w-full mt-1">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path
                d="M 0 20 Q 25 10, 50 22 T 80 8 T 100 6"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 20 Q 25 10, 50 22 T 80 8 T 100 6 L 100 30 L 0 30 Z"
                fill="url(#cyanSparkGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="cyanSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Suite Health
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Optimal
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalToolCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">tools loaded</span>
          </div>
          {/* Amber Micro Sparkline */}
          <div className="h-9 w-full mt-1">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path
                d="M 0 18 Q 30 5, 55 18 T 85 9 T 100 12"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 18 Q 30 5, 55 18 T 85 9 T 100 12 L 100 30 L 0 30 Z"
                fill="url(#amberSparkGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="amberSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN CHART: INTERACTIVE THROUGHPUT & VELOCITY AREA GRAPH   */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#673DE6]" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Browser Compute Velocity & Operation Timeline
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Interactive timeline benchmarking local WebAssembly, canvas rendering, and data parser speed.
            </p>
          </div>

          {/* Metric Selector Tabs & Timeframe */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMetricTab('throughput')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === 'throughput'
                    ? 'bg-white dark:bg-slate-900 text-[#673DE6] dark:text-[#A78BFA] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Throughput
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab('latency')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === 'latency'
                    ? 'bg-white dark:bg-slate-900 text-[#673DE6] dark:text-[#A78BFA] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Latency
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab('memory')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMetricTab === 'memory'
                    ? 'bg-white dark:bg-slate-900 text-[#673DE6] dark:text-[#A78BFA] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Memory Heap
              </button>
            </div>

            {/* Timeframe pill */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {['24h', '7d', '30d'].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The SVG Area Graph */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden pt-2">
          <svg
            viewBox={`0 0 ${chartSvgPath.width} ${chartSvgPath.height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="mainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#673DE6" stopOpacity="0.4" />
                <stop offset="85%" stopColor="#673DE6" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#673DE6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line
              x1={chartSvgPath.paddingX}
              y1={chartSvgPath.paddingY}
              x2={chartSvgPath.width - chartSvgPath.paddingX}
              y2={chartSvgPath.paddingY}
              stroke="currentColor"
              className="text-slate-200/70 dark:text-white/[0.04]"
              strokeDasharray="4 4"
            />
            <line
              x1={chartSvgPath.paddingX}
              y1={chartSvgPath.height / 2}
              x2={chartSvgPath.width - chartSvgPath.paddingX}
              y2={chartSvgPath.height / 2}
              stroke="currentColor"
              className="text-slate-200/70 dark:text-white/[0.04]"
              strokeDasharray="4 4"
            />
            <line
              x1={chartSvgPath.paddingX}
              y1={chartSvgPath.height - chartSvgPath.paddingY}
              x2={chartSvgPath.width - chartSvgPath.paddingX}
              y2={chartSvgPath.height - chartSvgPath.paddingY}
              stroke="currentColor"
              className="text-slate-200/90 dark:text-white/[0.08]"
            />

            {/* Area Fill */}
            <path d={chartSvgPath.areaD} fill="url(#mainAreaGrad)" />

            {/* Curve Stroke */}
            <path
              d={chartSvgPath.pathD}
              fill="none"
              stroke="#673DE6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Point Nodes */}
            {chartSvgPath.points.map((pt, idx) => (
              <g key={idx} className="cursor-pointer group">
                {/* Outer halo on active point */}
                {activeDataPointIndex === idx && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="#673DE6"
                    opacity="0.2"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={activeDataPointIndex === idx ? '5' : '3.5'}
                  fill="#ffffff"
                  stroke="#673DE6"
                  strokeWidth="2.5"
                  onMouseEnter={() => setActiveDataPointIndex(idx)}
                  onMouseLeave={() => setActiveDataPointIndex(null)}
                  className="transition-all duration-150"
                />
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip Callout */}
          {activeDataPointIndex !== null && (
            <div 
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-xl border border-slate-700 z-20"
              style={{
                left: `${(chartSvgPath.points[activeDataPointIndex].x / chartSvgPath.width) * 100}%`,
                top: `${(chartSvgPath.points[activeDataPointIndex].y / chartSvgPath.height) * 100 - 8}%`
              }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                <span>{chartData[activeDataPointIndex].display}</span>
                <span className="text-slate-400 font-normal">at {chartData[activeDataPointIndex].label}</span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Time Labels & Benchmark Badge */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.04] text-[11px] text-slate-400 font-mono">
          {chartData.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2-COLUMN INFOGRAPHICS: DONUT DISTRIBUTION & PIPELINE      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Infographic 1: Category Distribution Donut Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Suite Tool Distribution & Domain Share
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Breakdown of 42 utilities classified across developer functional domains.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="14"
                />
                {/* Category Segments */}
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.id}
                    cx="70"
                    cy="70"
                    r="54"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                ))}
              </svg>
              {/* Donut Center KPI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {totalToolCount}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Tools
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 w-full space-y-2">
              {categoryStats.map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center justify-between p-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({cat.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Modular Registry Active</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Client-Side</span>
          </div>
        </div>

        {/* Infographic 2: Client-Side Security Pipeline */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Zero-Knowledge Processing Pipeline
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Architectural diagram demonstrating 0-hop local sandboxing on your hardware.
            </p>
          </div>

          {/* Visual Pipeline Flow */}
          <div className="grid grid-cols-3 gap-3 my-2">
            {/* Stage 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/[0.04] text-center space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-[#673DE6] dark:text-[#A78BFA] flex items-center justify-center mx-auto">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">1. Input Stream</h4>
              <p className="text-[10px] text-slate-400 leading-tight">
                Data loaded via File API directly into RAM
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-3.5 rounded-xl bg-[#673DE6]/5 dark:bg-[#673DE6]/10 border border-[#673DE6]/20 text-center space-y-1.5 relative">
              <div className="w-8 h-8 rounded-lg bg-[#673DE6] text-white flex items-center justify-center mx-auto shadow-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#673DE6] dark:text-[#A78BFA]">2. WASM Core</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Sandboxed CPU/GPU transformation
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">3. Local Output</h4>
              <p className="text-[10px] text-slate-400 leading-tight">
                Instant download, zero network transmission
              </p>
            </div>
          </div>

          {/* Privacy Checklist */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero server logging</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Garbage collection on close</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SUITE TOOL DIRECTORY: SEARCH & FILTERABLE BENTO GRID      */}
      {/* ========================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Studio Tool Directory
            </h2>
            <p className="text-xs text-slate-400">
              Launch utilities directly or filter by suite category
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121620] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#673DE6]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white dark:bg-slate-900 text-[#673DE6] dark:text-[#A78BFA] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({totalToolCount})
          </button>
          {categoryStats.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-900 text-[#673DE6] dark:text-[#A78BFA] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Bento Grid of Tools */}
        {filteredTools.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-[#121620] rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
            No utilities match your search "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#673DE6]/50 dark:hover:border-[#673DE6]/50 hover:shadow-md transition-all duration-150 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="p-2 rounded-xl bg-[#673DE6]/10 text-[#673DE6] dark:text-[#A78BFA] group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tool.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#673DE6] dark:group-hover:text-[#A78BFA] transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-semibold text-[#673DE6] dark:text-[#A78BFA]">
                    <span>Launch Utility</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
