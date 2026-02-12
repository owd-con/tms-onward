// 1. React & core libraries
import { memo, useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// 3. Type definitions
interface TrackingFormProps {
  initialOrderNumber?: string;
}

// 4. Component definition dengan memo untuk performance
const TrackingForm = memo(({ initialOrderNumber = '' }: TrackingFormProps) => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-focus on desktop only (avoid mobile keyboard popup)
  useEffect(() => {
    if (!isMobile && !initialOrderNumber) {
      inputRef.current?.focus();
    }
  }, [isMobile, initialOrderNumber]);

  const validateOrderNumber = (value: string): string | null => {
    if (!value.trim()) {
      return 'Order number is required';
    }
    if (value.trim().length < 3) {
      return 'Order number must be at least 3 characters';
    }
    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateOrderNumber(orderNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Navigate to tracking result page
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();
    navigate(`/tracking/${trimmedOrderNumber}`);
  };

  const handleInputChange = (value: string) => {
    setOrderNumber(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {/* Input Group */}
        <div>
          <label htmlFor="orderNumber" className="sr-only">
            Order Number
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your order number"
              className={`
                w-full pl-12 pr-4 py-4 text-lg
                rounded-xl border-2
                ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'}
                focus:outline-none focus:ring-4
                transition-all
                placeholder:text-gray-400
              `}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'orderNumber-error' : 'orderNumber-help'}
            />
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Helper Text */}
          {!error && (
            <p id="orderNumber-help" className="mt-2 text-sm text-gray-500">
              Enter your order number (e.g., ORD-001)
            </p>
          )}

          {/* Error Message */}
          {error && (
            <p id="orderNumber-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="
            w-full py-4 px-6
            bg-primary text-white
            rounded-xl font-semibold text-lg
            hover:bg-primary/90 active:bg-primary/80
            focus:outline-none focus:ring-4 focus:ring-primary/20
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={!orderNumber.trim()}
        >
          Track Shipment
        </button>

        {/* Examples */}
        <div className="pt-2">
          <p className="text-xs text-gray-400 text-center">
            Try: <span className="font-mono text-gray-500">ORD-001</span> · <span className="font-mono text-gray-500">TRK-12345</span>
          </p>
        </div>
      </div>
    </form>
  );
});

// Named export (no displayName needed in modern React)
export { TrackingForm };