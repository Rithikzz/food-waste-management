/**
 * Loader — spinner with optional full-screen overlay.
 *
 * Props:
 *   fullScreen  boolean  — covers the whole viewport (default: false)
 *   size        'sm' | 'md' | 'lg'  (default: 'md')
 *   text        string   — caption below spinner (pass null to hide)
 */
const Loader = ({ fullScreen = false, size = 'md', text = 'Loading…' }) => {
  const sizeMap = { sm: 'h-6 w-6 border-2', md: 'h-10 w-10 border-4', lg: 'h-16 w-16 border-4' };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} border-green-200 border-t-green-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-gray-400 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="py-20 flex justify-center animate-fade-in">{spinner}</div>;
};

export default Loader;
