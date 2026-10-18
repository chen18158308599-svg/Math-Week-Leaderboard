import { Component } from "react";

// A failed lazy module or render should show a recovery action, not a blank screen.
export default class GameLoadBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="game-load-error" role="alert">
      <h1>This game could not open.</h1>
      <p>Reload to return to the game menu and try again.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload games</button>
    </main>;
  }
}
