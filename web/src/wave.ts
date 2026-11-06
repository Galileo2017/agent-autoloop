// Which wavelength a rule burns at: the same name always lands on the same line of the spectrum, so the board reads by
// colour as much as by form. Six wavelengths only; 589nm sodium never carries a rule, it is reserved for waiting. The
// hub's own cards have no rule at all, so they burn in plain ink.

const WAVES = ["var(--wl-0)", "var(--wl-1)", "var(--wl-2)", "var(--wl-3)", "var(--wl-4)", "var(--wl-5)"];
const INK = "var(--ink-mid)";

export const wavelength = (name: string | null | undefined) =>
  name ? WAVES[[...name].reduce((total, ch) => total * 31 + ch.charCodeAt(0), 7) % 6] : INK;
