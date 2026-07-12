export default function SectionHeading({ icon: Icon, title, children }) {
  return (
    <div className="section-heading">
      <div className="section-heading-icon">{Icon && <Icon size={18} />}{children}</div>
      <h2>{title}</h2>
      <span className="status-dot" />
    </div>
  );
}
