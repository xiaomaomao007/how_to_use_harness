interface IconProps {
  id?: string;
  className?: string;
}

/** Brand styles for each supported IDE. */
const IDE_STYLES: Record<string, { gradient: string; abbr: string }> = {
  "intellij-idea": {
    gradient: "linear-gradient(135deg, #FC1CFF 0%, #9C4DFF 40%, #087CFA 100%)",
    abbr: "IJ",
  },
  vscode: {
    gradient: "linear-gradient(135deg, #0098FF 0%, #0D6EFD 100%)",
    abbr: "VS",
  },
  cursor: {
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
    abbr: "▶",
  },
  webstorm: {
    gradient: "linear-gradient(135deg, #07C3F2 0%, #2948FF 100%)",
    abbr: "WS",
  },
  pycharm: {
    gradient: "linear-gradient(135deg, #21D789 0%, #FCF84A 100%)",
    abbr: "PC",
  },
  goland: {
    gradient: "linear-gradient(135deg, #FF1E00 0%, #D98014 100%)",
    abbr: "GO",
  },
  rustrover: {
    gradient: "linear-gradient(135deg, #FB7149 0%, #1C1C1C 100%)",
    abbr: "RR",
  },
  clion: {
    gradient: "linear-gradient(135deg, #F9A825 0%, #21D789 100%)",
    abbr: "CL",
  },
  phpstorm: {
    gradient: "linear-gradient(135deg, #B145FF 0%, #FF1E00 100%)",
    abbr: "PS",
  },
  rider: {
    gradient: "linear-gradient(135deg, #DD1845 0%, #2948FF 100%)",
    abbr: "RD",
  },
  "android-studio": {
    gradient: "linear-gradient(135deg, #3DDC84 0%, #073042 100%)",
    abbr: "AS",
  },
  fleet: {
    gradient: "linear-gradient(135deg, #FF1E56 0%, #0066FF 100%)",
    abbr: "FL",
  },
};

const DEFAULT_STYLE = {
  gradient: "linear-gradient(135deg, #58a6ff 0%, #8b949e 100%)",
  abbr: "</>",
};

/**
 * IDE brand icon — rounded square with brand gradient + abbreviation.
 * Supports all registered IDEs via `id` prop.
 */
export function IdeIcon({ id = "default", className = "w-3.5 h-3.5" }: IconProps) {
  const style = IDE_STYLES[id] || DEFAULT_STYLE;
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold text-white leading-none ${className}`}
      style={{
        background: style.gradient,
        fontSize: "0.55em",
        aspectRatio: "1",
      }}
    >
      {style.abbr}
    </span>
  );
}
