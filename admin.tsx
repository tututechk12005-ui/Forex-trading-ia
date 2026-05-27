import { AppLayout } from "@/components/layout";
import { 
  useGetAdminDashboard, 
  useListUsers, 
  useListAdminLogs, 
  useToggleAutoAnalysis, 
  useTogglePair,
  useListSubscribers,
  useListPairs
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, MessageSquare, Activity, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { data: dashboard } = useGetAdminDashboard();
  const { data: users } = useListUsers();
  const { data: logs } = useListAdminLogs();
  const { data: subscribers } = useListSubscribers();
  const { data: pairs, refetch: refetchPairs } = useListPairs();
  
  const toggleAutoAnalysis = useToggleAutoAnalysis();
  const togglePair = useTogglePair();

  const handleToggleAutoAnalysis = (enabled: boolean) => {
    toggleAutoAnalysis.mutate({ data: { enabled } }, {
      onSuccess: () => toast.success(`Auto-analysis ${enabled ? 'enabled' : 'disabled'}`),
      onError: () => toast.error("Failed to update auto-analysis setting")
    });
  };

  const handleTogglePair = (symbol: string, enabled: boolean) => {
    togglePair.mutate({ symbol, data: { enabled } }, {
      onSuccess: () => {
        toast.success(`${symbol} ${enabled ? 'enabled' : 'disabled'}`);
        refetchPairs();
      },
      onError: () => toast.error(`Failed to update ${symbol}`)
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-secondary" /> System Admin
            </h1>
            <p className="text-muted-foreground">Platform control and monitoring.</p>
          </div>
          
          <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full border border-white/10">
            <Label htmlFor="auto-analysis" className="font-mono text-sm cursor-pointer">AI Auto-Analysis</Label>
            <Switch 
              id="auto-analysis" 
              checked={dashboard?.autoAnalysisEnabled || false}
              onCheckedChange={handleToggleAutoAnalysis}
              disabled={toggleAutoAnalysis.isPending}
            />
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{dashboard?.activeUsers || 0} active</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Telegram Subs</CardTitle>
              <MessageSquare className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.telegramSubscribers || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Signals Today</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.todaySignals || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{dashboard?.totalSignals || 0} total all-time</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/5 bg-black/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
              <Bot className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.botUptime || "0h"}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pairs" className="w-full">
          <TabsList className="bg-black/40 border border-white/5 p-1 w-full justify-start h-auto rounded-lg">
            <TabsTrigger value="pairs" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">Trading Pairs</TabsTrigger>
            <TabsTrigger value="users" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">Users</TabsTrigger>
            <TabsTrigger value="telegram" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">Telegram Subs</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">System Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pairs" className="mt-6">
            <Card className="glass-card border-white/5 bg-black/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs?.map((pair) => (
                    <TableRow key={pair.id} className="border-white/5">
                      <TableCell className="font-bold">{pair.symbol}</TableCell>
                      <TableCell className="text-muted-foreground">{pair.name}</TableCell>
                      <TableCell><Badge variant="outline">{pair.category}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Switch 
                          checked={pair.enabled}
                          onCheckedChange={(v) => handleTogglePair(pair.symbol, v)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="glass-card border-white/5 bg-black/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className="border-white/5">
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={u.role === 'admin' ? 'bg-secondary text-white' : 'bg-white/10 text-gray-300'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="mt-6">
             <Card className="glass-card border-white/5 bg-black/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers?.map((sub) => (
                    <TableRow key={sub.id} className="border-white/5">
                      <TableCell className="font-medium">{sub.firstName || 'Unknown'}</TableCell>
                      <TableCell className="text-muted-foreground">{sub.username ? `@${sub.username}` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={sub.tier === 'premium' ? 'bg-primary text-black' : 'bg-white/10'}>
                          {sub.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.active ? (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-700">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card className="glass-card border-white/5 bg-black/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id} className="border-white/5">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30 font-mono text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-300 w-full">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
