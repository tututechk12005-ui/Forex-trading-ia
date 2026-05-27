import { AppLayout } from "@/components/layout";
import { useGetStatsOverview, useGetPerformance, useGetPairStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown, Activity, Award, BarChart2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function StatCard({ title, value, icon: Icon, description, trend }: any) {
  return (
    <Card className="glass-card border-white/5 bg-black/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={trend === "up" ? "text-primary mr-1" : "text-destructive mr-1"}>
                {trend === "up" ? "↑" : "↓"}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: overview } = useGetStatsOverview();
  const { data: performance } = useGetPerformance({ period });
  const { data: pairStats } = useGetPairStats();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Analytics</h1>
          <p className="text-muted-foreground">System-wide trading metrics and AI accuracy.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Win Rate" 
            value={`${overview?.winRate?.toFixed(1) || 0}%`} 
            icon={Target} 
            description="Overall accuracy" 
            trend="up"
          />
          <StatCard 
            title="Total Profit" 
            value={`${overview?.totalPips ? (overview.totalPips > 0 ? '+' : '') : ''}${overview?.totalPips || 0} pips`} 
            icon={Activity} 
            description="All-time return" 
            trend={overview?.totalPips && overview.totalPips > 0 ? "up" : "down"}
          />
          <StatCard 
            title="Best Pair" 
            value={overview?.bestPair || "N/A"} 
            icon={Award} 
            description="Highest win rate" 
          />
          <StatCard 
            title="Total Signals" 
            value={overview?.totalSignals || 0} 
            icon={BarChart2} 
            description={`${overview?.totalWins || 0}W / ${overview?.totalLosses || 0}L`} 
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profit Curve (Pips)</CardTitle>
              <ToggleGroup type="single" value={period} onValueChange={(v: any) => v && setPeriod(v)} size="sm">
                <ToggleGroupItem value="daily">D</ToggleGroupItem>
                <ToggleGroupItem value="weekly">W</ToggleGroupItem>
                <ToggleGroupItem value="monthly">M</ToggleGroupItem>
              </ToggleGroup>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {performance && performance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(169, 100%, 50%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(169, 100%, 50%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15,15,18,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(169, 100%, 50%)' }}
                      />
                      <Area type="monotone" dataKey="profit" stroke="hsl(169, 100%, 50%)" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader>
              <CardTitle>Win Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {performance && performance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15,15,18,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="winRate" stroke="hsl(264, 33%, 51%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(264, 33%, 51%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-white/5 bg-black/20 overflow-hidden">
          <CardHeader>
            <CardTitle>Pair Breakdown</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Net Pips</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairStats?.map((stat) => (
                  <TableRow key={stat.symbol} className="border-white/5">
                    <TableCell className="font-bold">{stat.symbol}</TableCell>
                    <TableCell className="text-right font-mono">{stat.totalSignals}</TableCell>
                    <TableCell className="text-right font-mono text-primary">{stat.wins}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{stat.losses}</TableCell>
                    <TableCell className="text-right font-mono">{stat.winRate.toFixed(1)}%</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${stat.totalPips > 0 ? 'text-primary' : stat.totalPips < 0 ? 'text-destructive' : ''}`}>
                      {stat.totalPips > 0 ? '+' : ''}{stat.totalPips}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
