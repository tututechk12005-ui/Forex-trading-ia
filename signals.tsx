import { AppLayout } from "@/components/layout";
import { useListSignals } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Signals() {
  const [pairFilter, setPairFilter] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<string>("");
  
  const { data, isLoading } = useListSignals({ pair: pairFilter || undefined, result: resultFilter !== "ALL" ? resultFilter : undefined });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Signal History</h1>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search pair (e.g. EURUSD)" 
                value={pairFilter}
                onChange={(e) => setPairFilter(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 focus:border-primary"
              />
            </div>
            
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
                <SelectValue placeholder="Filter by Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Results</SelectItem>
                <SelectItem value="win">Win</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="breakeven">Break Even</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="font-medium text-muted-foreground">Pair</TableHead>
                <TableHead className="font-medium text-muted-foreground">Direction</TableHead>
                <TableHead className="font-medium text-muted-foreground">Entry</TableHead>
                <TableHead className="font-medium text-muted-foreground">Targets</TableHead>
                <TableHead className="font-medium text-muted-foreground">Confidence</TableHead>
                <TableHead className="font-medium text-muted-foreground">Result</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Pips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading signal history...
                  </TableCell>
                </TableRow>
              ) : data?.signals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No signals found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data?.signals.map((signal) => (
                  <TableRow key={signal.id} className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(signal.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-bold">{signal.pair}</TableCell>
                    <TableCell>
                      <Badge className={signal.direction === 'BUY' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30' : 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30'}>
                        {signal.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{signal.entryPrice.toFixed(5)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="text-destructive/80">SL: {signal.stopLoss.toFixed(5)}</span><br/>
                      <span className="text-primary/80">TP: {signal.takeProfit1.toFixed(5)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{signal.confidence}%</span>
                        <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${signal.confidence}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {!signal.result ? (
                        <Badge variant="outline" className="text-gray-400 border-gray-700">Pending</Badge>
                      ) : signal.result === 'win' ? (
                        <Badge className="bg-primary text-black">WIN</Badge>
                      ) : signal.result === 'loss' ? (
                        <Badge variant="destructive">LOSS</Badge>
                      ) : (
                        <Badge variant="secondary">BREAKEVEN</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${!signal.pips ? 'text-muted-foreground' : signal.pips > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {signal.pips ? (signal.pips > 0 ? `+${signal.pips}` : signal.pips) : '--'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
