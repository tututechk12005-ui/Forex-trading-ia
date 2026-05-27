import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useListPairs, useGenerateSignal, useGetAnalysis, useGetDetectors, getGetAnalysisQueryKey, getGetDetectorsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Clock, AlertTriangle, Crosshair, BarChart3, Database, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function PairCard({ pair, isSelected, onClick }: any) {
  const isUp = pair.trend === "BULLISH" || pair.bias === "BUY";
  
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`glass-card p-5 rounded-xl cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary neon-glow' : 'hover:border-primary/50'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl">{pair.symbol}</h3>
          <p className="text-xs text-muted-foreground">{pair.name}</p>
        </div>
        <Badge variant="outline" className={isUp ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
          {pair.bias || "NEUTRAL"}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-mono">{pair.currentPrice?.toFixed(5) || "---"}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Spread</span>
          <span className="font-mono">{pair.spread ? `${pair.spread.toFixed(1)} pip` : "---"}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Volatility</span>
          <span>{pair.volatility || "---"}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="text-primary">{pair.confidence || 0}%</span>
          </div>
          <Progress value={pair.confidence || 0} className="h-1 bg-black/40" />
        </div>
      </div>
    </motion.div>
  );
}

function SignalAnalysisView({ symbol }: { symbol: string }) {
  const { data: analysis, isLoading: analysisLoading } = useGetAnalysis(symbol, { 
    query: { enabled: !!symbol, queryKey: getGetAnalysisQueryKey(symbol) } 
  });
  
  const { data: detectors, isLoading: detectorsLoading } = useGetDetectors(symbol, {
    query: { enabled: !!symbol, queryKey: getGetDetectorsQueryKey(symbol) }
  });

  if (analysisLoading || detectorsLoading) {
    return (
      <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono animate-pulse">ANALYZING MARKET DATA...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const isBuy = analysis.direction === "BUY";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className={`glass-card p-8 rounded-xl border-l-4 ${isBuy ? 'border-l-primary neon-glow' : 'border-l-destructive shadow-[0_0_15px_rgba(255,0,0,0.2)]'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-3">
              {symbol} SIGNAL
              <Badge className={`text-lg px-4 py-1 ${isBuy ? 'bg-primary text-black' : 'bg-destructive text-white'}`}>
                {analysis.direction}
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Generated: {new Date(analysis.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-white font-mono">{analysis.confidence}%</div>
            <p className="text-primary text-sm tracking-widest uppercase mt-1">AI Confidence</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/30 p-4 rounded-lg border border-white/5">
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Entry</p>
            <p className="font-mono text-xl font-bold">{analysis.entryPrice.toFixed(5)}</p>
          </div>
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="text-destructive text-xs uppercase tracking-wider mb-1">Stop Loss</p>
            <p className="font-mono text-xl font-bold">{analysis.stopLoss.toFixed(5)}</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <p className="text-primary text-xs uppercase tracking-wider mb-1">Take Profit 1</p>
            <p className="font-mono text-xl font-bold">{analysis.takeProfit1.toFixed(5)}</p>
          </div>
          <div className="bg-primary/20 p-4 rounded-lg border border-primary/30">
            <p className="text-primary text-xs uppercase tracking-wider mb-1">Take Profit 2</p>
            <p className="font-mono text-xl font-bold">{analysis.takeProfit2.toFixed(5)}</p>
          </div>
        </div>

        <div className="bg-black/20 p-5 rounded-lg border border-white/5 mb-8">
          <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> AI Analysis
          </h4>
          <p className="text-lg leading-relaxed text-gray-300">{analysis.explanation}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" /> Indicators
            </h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-500">RSI</span> <span>{analysis.rsi.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">MACD</span> <span>{analysis.macd.toFixed(5)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">EMA50</span> <span>{analysis.ema50.toFixed(5)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ATR</span> <span>{analysis.atr.toFixed(5)}</span></div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" /> Smart Money
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">BOS</span> {analysis.bosDetected ? <span className="text-primary">Detected</span> : <span>None</span>}</div>
              <div className="flex justify-between"><span className="text-gray-500">CHOCH</span> {analysis.chochDetected ? <span className="text-primary">Detected</span> : <span>None</span>}</div>
              <div className="flex justify-between"><span className="text-gray-500">FVG</span> {analysis.fvgDetected ? <span className="text-primary">Detected</span> : <span>None</span>}</div>
              <div className="flex justify-between"><span className="text-gray-500">Liq. Sweep</span> {analysis.liquiditySweep ? <span className="text-primary">Detected</span> : <span>None</span>}</div>
            </div>
          </div>
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Session Context
            </h4>
            <div className="bg-black/30 p-4 rounded border border-white/5 h-full flex flex-col justify-center">
              <p className="text-gray-300">Active Session: <span className="font-bold text-white">{analysis.session}</span></p>
              <p className="text-sm mt-2 text-gray-400">Trend Bias: <span className="uppercase text-white">{analysis.trend}</span></p>
              {analysis.breakout && <Badge className="bg-secondary/20 text-secondary w-fit mt-2">Breakout Detected</Badge>}
            </div>
          </div>
        </div>
      </div>

      {detectors && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Live Detectors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(detectors).map(([key, value]) => {
              if (key === 'symbol') return null;
              const detector = value as any;
              if (!detector || !detector.name) return null;
              return (
                <div key={key} className="glass-card p-4 rounded-lg bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-gray-200">{detector.name}</h5>
                    <Badge variant="outline" className="border-primary/30 text-primary">{detector.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 h-8 line-clamp-2">{detector.detail}</p>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500">Accuracy {detector.accuracy}%</span>
                    <span className="text-gray-500">Conf {detector.confidence}%</span>
                  </div>
                  <Progress value={detector.confidence} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [signalGeneratedFor, setSignalGeneratedFor] = useState<string | null>(null);
  
  const { data: pairs, isLoading } = useListPairs();
  const generateMutation = useGenerateSignal();

  const handleGenerate = () => {
    if (!selectedPair) return;
    
    generateMutation.mutate(
      { data: { symbol: selectedPair, sendTelegram: true } },
      {
        onSuccess: () => {
          toast.success(`Signal generated for ${selectedPair}`);
          setSignalGeneratedFor(selectedPair);
        },
        onError: () => {
          toast.error("Failed to generate signal");
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2">Command Center</h1>
          <p className="text-muted-foreground">Select a pair to analyze real-time market data.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-32 glass-card rounded-xl animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {pairs?.filter(p => p.enabled).map((pair) => (
              <PairCard 
                key={pair.id} 
                pair={pair} 
                isSelected={selectedPair === pair.symbol}
                onClick={() => {
                  setSelectedPair(pair.symbol);
                  setSignalGeneratedFor(null);
                }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedPair && !signalGeneratedFor && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-12 rounded-xl text-center border border-primary/20 neon-glow"
            >
              <h2 className="text-2xl mb-6">Analyze <span className="font-bold text-primary">{selectedPair}</span></h2>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                size="lg"
                className="w-full max-w-md h-16 text-xl font-bold tracking-wider bg-primary hover:bg-primary/90 text-black shadow-[0_0_30px_rgba(0,255,209,0.3)] transition-all hover:scale-105"
              >
                {generateMutation.isPending ? "COMPUTING..." : "INITIALIZE SIGNAL GENERATION"}
              </Button>
            </motion.div>
          )}

          {signalGeneratedFor && (
            <SignalAnalysisView symbol={signalGeneratedFor} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
