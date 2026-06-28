type BlackEggHeroV2Props = {
  name?: string;
  compact?: boolean;
};

export default function BlackEggHeroV2({ name = "", compact = false }: BlackEggHeroV2Props) {
  return (
    <div className={`crow-v2-ball ${compact ? "is-compact" : ""}`} aria-label={name ? `${name} 검은 구슬` : "검은 구슬"}>
      <i />
      {name && <span>{name}</span>}
    </div>
  );
}
