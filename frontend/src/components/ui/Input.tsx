interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({
  className = "",
  disabled,
  ...props
}) => {
  return (
    <input
      {...props}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
        ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
        ${className}`}
    />
  );
};
