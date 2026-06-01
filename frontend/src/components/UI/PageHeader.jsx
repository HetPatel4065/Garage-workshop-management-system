
const PageHeader = ({ title, subtitle, category, action }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        {category && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {category}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="self-start sm:self-auto shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
