import "./Placeholder.css";

function Placeholder({ title }) {
  return (
    <div className="placeholder">
      <h1 className="placeholder__title">{title} — страница в разработке</h1>
    </div>
  );
}

export default Placeholder;
