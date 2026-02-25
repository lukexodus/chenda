"use client";

import React, { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary — catches uncaught render errors anywhere in the
 * component tree and shows a user-friendly fallback instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production you'd send this to Sentry / Datadog etc.
        console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="text-4xl">⚠️</div>
                    <h1 className="text-xl font-semibold text-gray-800">
                        Something went wrong
                    </h1>
                    <p className="max-w-sm text-sm text-gray-500">
                        {this.state.error?.message ?? "An unexpected error occurred."}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="mt-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="text-sm text-gray-400 underline hover:text-gray-600"
                    >
                        Go to home
                    </Link>
                </div>
            );
        }

        return this.props.children;
    }
}
