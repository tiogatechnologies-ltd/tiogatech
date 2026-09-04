import React, { Component, ErrorInfo, ReactNode } from "react";
import { RotateCcw, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-foreground">
                Temporary Loading Interruption
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We encountered a brief connection or loading issue. Tap reload below to refresh the page.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={this.handleReload}
                className="gap-2 rounded-xl font-bold text-xs shadow-md"
              >
                <RotateCcw size={14} />
                <span>Reload Page</span>
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="gap-2 rounded-xl text-xs"
              >
                <Home size={14} />
                <span>Go to Home</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
