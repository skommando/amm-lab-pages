// Dialog behavior follows this internal state, never its translated heading.
export function createOverlayState() {
  let kind = null;
  return {
    get kind() { return kind; },
    show(value = 'dialog') { kind = value; },
    hide() { kind = null; },
    togglePause(pause, resume) { if (kind === 'pause') resume(); else if (kind === null) pause(); },
  };
}
