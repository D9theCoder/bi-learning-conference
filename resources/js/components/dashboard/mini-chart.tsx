import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  type?: 'area' | 'line';
  color?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showAxes?: boolean;
  showAxisLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export function MiniChart({
  data,
  type = 'area',
  // Use direct CSS variables (oklch values) instead of wrapping with hsl()
  // which can produce invalid colors when the variable is already a color function.
  color = 'var(--chart-1)',
  xAxisLabel = 'Time',
  yAxisLabel = 'Value',
  showGrid = true,
  showAxes = true,
  showAxisLabels = true,
  compact = true,
  height = 60,
  className,
}: MiniChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/30',
          className,
        )}
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">No data</p>
      </div>
    );
  }

  return (
    // Wrap the ResponsiveContainer so we can ensure the parent has a fixed
    // height and allows overflow to be visible (prevents strokes from being
    // clipped at the top/bottom).
    <div style={{ height, overflow: 'visible' }} className={cn(className)}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart
            data={data}
            margin={
              showAxes
                ? {
                    top: compact ? 4 : 6,
                    right: compact ? 4 : 6,
                    left: compact ? 7 : 8,
                    bottom: compact ? 16 : 28,
                  }
                : { top: 0, right: 0, left: 0, bottom: 0 }
            }
          >
            {showGrid && (
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.06} />
            )}
            {showAxes && (
              <XAxis
                dataKey="name"
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: compact ? 11 : 12,
                }}
                tickMargin={compact ? 2 : 4}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                label={
                  showAxisLabels && xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: 'bottom',
                        offset: compact ? 6 : 8,
                        fill: 'var(--muted-foreground)',
                        style: { fontSize: compact ? 11 : 12 },
                      }
                    : undefined
                }
              />
            )}
            {showAxes && (
              <YAxis
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: compact ? 11 : 12,
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={compact ? 2 : 4}
                tickCount={4}
                domain={[0, 'auto']}
                label={
                  showAxisLabels && yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'left',
                        offset: 0,
                        fill: 'var(--muted-foreground)',
                        style: { fontSize: compact ? 11 : 12 },
                      }
                    : undefined
                }
              />
            )}
            <defs>
              <linearGradient
                id="miniChartGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                // Use the CSS variables directly. These are defined as oklch(...)
                // in the stylesheet so wrapping them in another color fn breaks them.
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#miniChartGradient)"
            />
          </AreaChart>
        ) : (
          <LineChart
            data={data}
            margin={
              showAxes
                ? {
                    top: compact ? 4 : 6,
                    right: compact ? 4 : 6,
                    left: compact ? 28 : 36, // extra space for y-axis label
                    bottom: compact ? 16 : 28,
                  }
                : { top: 0, right: 0, left: 0, bottom: 0 }
            }
          >
            {showGrid && (
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.06} />
            )}
            {showAxes && (
              <XAxis
                dataKey="name"
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: compact ? 11 : 12,
                }}
                tickMargin={compact ? 2 : 4}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                label={
                  showAxisLabels && xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: 'bottom',
                        offset: compact ? 6 : 8,
                        fill: 'var(--muted-foreground)',
                        style: { fontSize: compact ? 11 : 12 },
                      }
                    : undefined
                }
              />
            )}
            {showAxes && (
              <YAxis
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: compact ? 11 : 12,
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={compact ? 2 : 4}
                tickCount={4}
                domain={[0, 'auto']}
                label={
                  showAxisLabels && yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'left',
                        offset: 0,
                        fill: 'var(--muted-foreground)',
                        style: { fontSize: compact ? 11 : 12 },
                      }
                    : undefined
                }
              />
            )}
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
