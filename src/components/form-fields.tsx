import type { ReactNode } from "react";

const control =
  "w-full border-thin bg-paper px-unit py-tick text-ink outline-none focus-visible:border-mark disabled:text-ink-3";

export function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-tick">
      <label htmlFor={name} className="text-chrome text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-chrome text-mark">
          {error}
        </p>
      ) : hint ? (
        <p className="text-chrome text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string };
export function Input(props: InputProps) {
  return <input id={props.name} className={control} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string };
export function Textarea(props: TextareaProps) {
  return <textarea id={props.name} className={`${control} font-chrome leading-relaxed`} {...props} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { name: string };
export function Select(props: SelectProps) {
  return <select id={props.name} className={control} {...props} />;
}

export function Button({
  children,
  tone = "ink",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "mark" }) {
  const color = tone === "mark" ? "border-mark text-mark hover:bg-mark-soft" : "border-ink text-ink hover:border-mark hover:text-mark";
  return (
    <button
      className={`border-thin px-unit-2 py-tick text-chrome ${color} disabled:border-line disabled:text-ink-3 disabled:hover:bg-transparent`}
      {...props}
    >
      {children}
    </button>
  );
}
