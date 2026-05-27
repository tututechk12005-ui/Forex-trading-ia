import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        loginMutation.mutate(
          { data: { email, password } },
          {
            onSuccess: (data) => {
              login(data.token, data.user);
              toast.success("Welcome back to the command center.");
              setLocation("/dashboard");
            },
            onError: () => {
              toast.error("Invalid credentials.");
            }
          }
        );
      } else {
        registerMutation.mutate(
          { data: { email, password, username } },
          {
            onSuccess: (data) => {
              login(data.token, data.user);
              toast.success("Registration complete.");
              setLocation("/dashboard");
            },
            onError: () => {
              toast.error("Registration failed.");
            }
          }
        );
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 255, 209, 0.15), transparent 60%)" }} />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(123, 94, 167, 0.3), transparent 50%)" }} />
      
      <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-2xl relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 neon-glow">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            ForexSignal <span className="text-primary">AI</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            Enter the command center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/20 border-border/50 focus:border-primary transition-colors"
                placeholder="trader_x"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/20 border-border/50 focus:border-primary transition-colors"
              placeholder="operator@system.io"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/20 border-border/50 focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full neon-glow font-bold text-primary-foreground hover:brightness-110"
            disabled={loginMutation.isPending || registerMutation.isPending}
          >
            {isLogin ? "INITIALIZE SESSION" : "REGISTER OPERATOR"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Request access (Register)" : "Already have clearance? (Login)"}
          </button>
        </div>
      </div>
    </div>
  );
}
