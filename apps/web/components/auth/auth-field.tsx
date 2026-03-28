type AuthFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  helperText?: string;
  as?: "input" | "textarea";
  rows?: number;
};

export default function AuthField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  type = "text",
  autoComplete,
  helperText,
  as = "input",
  rows = 4
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          id={id}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
      )}
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}
