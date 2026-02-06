import { type ReactNode } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

interface HeaderProps {
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  withBack?: boolean;
  onBack?: () => void;
  action?: ReactNode;
  extra?: ReactNode;
}

const Header = ({
  className,
  title,
  subtitle,
  withBack,
  onBack,
  action,
  extra,
}: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={clsx(
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 sticky top-0 z-10",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {withBack && (
          <button
            onClick={handleBack}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="typo-screen-title font-semibold truncate">{title}</h1>
            {extra}
          </div>
          {subtitle && (
            <p className="typo-small text-blue-100 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default Header;
