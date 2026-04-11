import draughtIcon from "../assets/Draught.png";
import canIcon from "../assets/can.png";
import bottleIcon from "../assets/bottle.png";

const ICONS = {
  draught: draughtIcon,
  can: canIcon,
  bottle: bottleIcon,
};

export default function BeerTypeIcon({ type, size = 24, style = {} }) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  let icon = null;
  if (normalized.includes("draught") || normalized.includes("draft"))
    icon = ICONS.draught;
  else if (normalized.includes("can")) icon = ICONS.can;
  else if (normalized.includes("bottle")) icon = ICONS.bottle;
  if (!icon)
    return (
      <span style={{ width: size, height: size, display: "inline-block" }} />
    );
  return (
    <img
      src={icon}
      alt={type}
      height={size}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        height: size,
        width: "auto",
        ...style,
      }}
    />
  );
}
