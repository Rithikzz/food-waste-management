/** Reusable spinning indicator (three sizes: sm | md | lg). */
const Spinner = ({ size = "md", className = "" }) => {
  const sz = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-4", lg: "h-14 w-14 border-4" }[size];
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sz} animate-spin rounded-full border-green-200 border-t-green-600`}
      />
    </div>
  );
};

export default Spinner;
