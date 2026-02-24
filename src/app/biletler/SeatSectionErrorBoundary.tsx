"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean; error: Error | null };

export class SeatSectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Bilet bölümü hatası:", error?.message ?? String(error), error?.stack, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border-2 border-bordo/30 bg-bordo/5 p-6 text-center">
          <p className="font-semibold text-siyah">Koltuk seçimi yüklenemedi.</p>
          <p className="mt-2 text-sm text-siyah/70">
            Sayfayı yenileyip tekrar deneyin. Sorun sürerse destek ile iletişime geçin.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
