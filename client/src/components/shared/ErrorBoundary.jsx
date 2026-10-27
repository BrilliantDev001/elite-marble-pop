import { Component } from "react";

// If any part of the website crashes while it is being drawn, this shows a friendly page instead of
// a blank screen, and writes the real error to the browser console so it can be fixed.
// (It must be a class: this is the one thing React only allows classes to do.)
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("The page crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12 text-obsidian">
        <div role="alert" className="max-w-md border border-obsidian/25 p-8">
          <h1 className="text-4xl font-medium">Something went wrong.</h1>
          <p className="mt-4 text-obsidian/80">
            We are sorry. This page could not be shown. Reloading usually fixes
            it.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload the page
            </button>
            {/* A plain link on purpose: it reloads everything, which clears the error. */}
            <a href="/" className="btn-outline">
              Go to the home page
            </a>
          </div>
        </div>
      </main>
    );
  }
}
