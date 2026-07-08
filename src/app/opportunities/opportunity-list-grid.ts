export function opportunityDesktopGridClass(showBdrColumn: boolean) {
  return showBdrColumn
    ? "grid-cols-[minmax(5.5rem,0.65fr)_minmax(8rem,0.95fr)_minmax(9rem,1.35fr)_minmax(7rem,0.7fr)_minmax(7rem,0.85fr)_minmax(9rem,1.1fr)_minmax(9rem,1.05fr)_minmax(10.5rem,1.2fr)_minmax(4rem,0.4fr)]"
    : "grid-cols-[minmax(5.5rem,0.65fr)_minmax(10rem,1.45fr)_minmax(7rem,0.75fr)_minmax(7rem,0.85fr)_minmax(9rem,1.15fr)_minmax(9rem,1.05fr)_minmax(10.5rem,1.25fr)_minmax(4rem,0.45fr)]";
}
