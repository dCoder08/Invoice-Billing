function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;