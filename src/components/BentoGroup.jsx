import { iconRegistry } from '../data/icons.js';

export default function BentoGroup({ groupName, group }) {
  const GroupIcon = iconRegistry[group.icon];
  const accent = `var(${group.accentVar})`;
  const accentBg = `rgba(var(${group.accentRgbVar}), 0.10)`;

  return (
    <div className={`bento-cell bento-${groupName.toLowerCase()}`}>
      <div className="bento-category-header">
        <div className="bento-category-icon" style={{ background: accentBg, color: accent }}>
          {GroupIcon && <GroupIcon size={16} />}
        </div>
        <div>
          <div className="bento-category-label" style={{ color: accent }}>{groupName}</div>
          <div className="bento-category-desc">{group.description}</div>
        </div>
      </div>
      <div className="bento-skill-list">
        {group.items.map(({ name, icon }) => {
          const SkillIcon = iconRegistry[icon];
          return <div key={name} className="bento-skill-item">{SkillIcon && <SkillIcon size={14} style={{ color: accent }} />}<span>{name}</span></div>;
        })}
      </div>
    </div>
  );
}
