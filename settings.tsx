import { AppLayout } from "@/components/layout";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Key, Bot, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [formData, setFormData] = useState({
    telegramBotToken: "",
    twelveDataApiKey: "",
    alphaVantageApiKey: "",
    openAiApiKey: "",
    binanceApiKey: "",
    autoAnalysisEnabled: false,
    analysisIntervalMinutes: 60,
    telegramEnabled: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        telegramBotToken: "",
        twelveDataApiKey: "",
        alphaVantageApiKey: "",
        openAiApiKey: "",
        binanceApiKey: "",
        autoAnalysisEnabled: settings.autoAnalysisEnabled,
        analysisIntervalMinutes: settings.analysisIntervalMinutes,
        telegramEnabled: settings.telegramEnabled,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send fields that have values (for keys) or are booleans/numbers
    const updateData: any = {
      autoAnalysisEnabled: formData.autoAnalysisEnabled,
      analysisIntervalMinutes: formData.analysisIntervalMinutes,
      telegramEnabled: formData.telegramEnabled,
    };

    if (formData.telegramBotToken) updateData.telegramBotToken = formData.telegramBotToken;
    if (formData.twelveDataApiKey) updateData.twelveDataApiKey = formData.twelveDataApiKey;
    if (formData.alphaVantageApiKey) updateData.alphaVantageApiKey = formData.alphaVantageApiKey;
    if (formData.openAiApiKey) updateData.openAiApiKey = formData.openAiApiKey;
    if (formData.binanceApiKey) updateData.binanceApiKey = formData.binanceApiKey;

    updateSettings.mutate({ data: updateData }, {
      onSuccess: () => {
        toast.success("Settings updated successfully");
        // Clear key fields after save
        setFormData(prev => ({
          ...prev,
          telegramBotToken: "",
          twelveDataApiKey: "",
          alphaVantageApiKey: "",
          openAiApiKey: "",
          binanceApiKey: ""
        }));
      },
      onError: () => toast.error("Failed to update settings")
    });
  };

  if (isLoading) {
    return <AppLayout><div className="text-center py-12 text-muted-foreground animate-pulse">Loading configuration...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-primary" /> System Configuration
          </h1>
          <p className="text-muted-foreground">Manage API keys and system behavior.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-secondary" /> Automation Settings
              </CardTitle>
              <CardDescription>Configure how the AI operates autonomously.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Analysis Engine</Label>
                  <p className="text-sm text-muted-foreground">Periodically scan active pairs for signals.</p>
                </div>
                <Switch 
                  checked={formData.autoAnalysisEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAnalysisEnabled: checked }))}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="interval">Analysis Interval (minutes)</Label>
                <Input 
                  id="interval"
                  type="number"
                  min="5"
                  max="1440"
                  value={formData.analysisIntervalMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, analysisIntervalMinutes: parseInt(e.target.value) || 60 }))}
                  className="bg-black/40 border-white/10 max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">How often the engine scans all pairs.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Telegram Broadcasting</Label>
                  <p className="text-sm text-muted-foreground">Automatically send new signals to Telegram subscribers.</p>
                </div>
                <Switch 
                  checked={formData.telegramEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, telegramEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-primary" /> API Providers
              </CardTitle>
              <CardDescription>Enter new keys to update. Leave blank to keep existing keys.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex justify-between">
                  OpenAI API Key
                  {settings?.hasOpenAiKey && <span className="text-xs text-emerald-400">● Configured</span>}
                </Label>
                <Input 
                  type="password"
                  placeholder={settings?.hasOpenAiKey ? "••••••••••••••••••••••••••••••••" : "sk-..."}
                  value={formData.openAiApiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, openAiApiKey: e.target.value }))}
                  className="bg-black/40 border-white/10 font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex justify-between">
                  TwelveData API Key
                  {settings?.hasTwelveDataKey && <span className="text-xs text-emerald-400">● Configured</span>}
                </Label>
                <Input 
                  type="password"
                  placeholder={settings?.hasTwelveDataKey ? "••••••••••••••••••••••••••••••••" : "Enter key..."}
                  value={formData.twelveDataApiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, twelveDataApiKey: e.target.value }))}
                  className="bg-black/40 border-white/10 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  AlphaVantage API Key
                  {settings?.hasAlphaVantageKey && <span className="text-xs text-emerald-400">● Configured</span>}
                </Label>
                <Input 
                  type="password"
                  placeholder={settings?.hasAlphaVantageKey ? "••••••••••••••••••••••••••••••••" : "Enter key..."}
                  value={formData.alphaVantageApiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, alphaVantageApiKey: e.target.value }))}
                  className="bg-black/40 border-white/10 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Binance API Key
                  {settings?.hasBinanceKey && <span className="text-xs text-emerald-400">● Configured</span>}
                </Label>
                <Input 
                  type="password"
                  placeholder={settings?.hasBinanceKey ? "••••••••••••••••••••••••••••••••" : "Enter key..."}
                  value={formData.binanceApiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, binanceApiKey: e.target.value }))}
                  className="bg-black/40 border-white/10 font-mono text-sm"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <Label className="flex justify-between">
                  Telegram Bot Token
                  {settings?.hasTelegramToken && <span className="text-xs text-emerald-400">● Configured</span>}
                </Label>
                <Input 
                  type="password"
                  placeholder={settings?.hasTelegramToken ? "••••••••••••••••••••••••••••••••" : "123456789:ABCdefGHI..."}
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                  className="bg-black/40 border-white/10 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              className="bg-primary text-black hover:bg-primary/90 min-w-[200px] neon-glow font-bold tracking-wider"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? "SAVING..." : "SAVE CONFIGURATION"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
