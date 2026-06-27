// Layered, heavily-blurred glow pools that float slowly behind the content —
// the "ambient lighting" depth cue. Purely decorative.
export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="blob blob--1" />
      <span className="blob blob--2" />
      <span className="blob blob--3" />
    </div>
  );
}
