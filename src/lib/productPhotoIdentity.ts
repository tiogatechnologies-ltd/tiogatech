/** Stable catalogue identity, shared by the photo manifest generator and storefront. */
export const photoNameKey = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function photoBrandKey(value = ""): string {
  const key = photoNameKey(value);
  if (key === "sorotech") return "sorotec";
  if (key === "exulteddealer" || key === "exulted") return "exultedeagles";
  return key;
}

export function productPhotoForm(name = "", category = ""): string {
  const n = name.toLowerCase();
  if (/parallel.*cable|cable.*set/.test(n)) return "cable";
  if (/layer.*rack|enclosure rack/.test(n)) return "empty-rack";
  if (/control unit|cluster controller|master control|\bbcu\b|\bpdu\b/.test(n)) return "controller-box";
  if (/module|modular.*pack/.test(n) && /battery|bos-g/.test(n)) return "battery-module";
  if (/charge controller|mppt.*controller/.test(n)) return "charge-controller";
  if (/busbar|combiner box/.test(n)) return "busbar-box";
  if (/\bfan\b/.test(n)) return "fan";
  if (/solar flood|flood light/.test(n)) return "flood-light";
  if (/street light/.test(n)) return "street-light";
  if (/expansion pole/.test(n)) return "pole";
  if (/power station|solar generator|vitabank/.test(n)) return "power-station";
  if (/solar.*(?:panel|mono|poly)|photovoltaic/.test(n)) return "panel";
  if (/all.in.one|eco beast|\bess\b.*cabinet/.test(n)) return "all-in-one";
  if (/\bket\b|hvs|hvm|bos-g.*system|high.voltage.*(?:battery system|energy storage)|commercial.*(?:battery|storage)|ess rack/.test(n)) return "battery-system";
  if (/battery|lifepo4|lithium|powergem|pgem/.test(n)) return "battery";
  if (/inverter/.test(n)) return "inverter";
  const c = category.toLowerCase();
  if (/charge controller/.test(c)) return "charge-controller";
  if (/solar panel/.test(c)) return "panel";
  if (/batter/.test(c)) return "battery";
  if (/inverter/.test(c)) return "inverter";
  if (/portable power/.test(c)) return "power-station";
  if (/all.in.one/.test(c)) return "all-in-one";
  if (/ess/.test(c)) return "battery-system";
  return "";
}
