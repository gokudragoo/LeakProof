export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Shield background */}
      <path
        d="M20 4L6 10V18C6 26.8366 12.4772 34.8508 20 36.5C27.5228 34.8508 34 26.8366 34 18V10L20 4Z"
        fill="url(#logoGradient)"
        opacity="0.2"
      />
      <path
        d="M20 6L8 11V18C8 25.732 13.732 32.464 20 34C26.268 32.464 32 25.732 32 18V11L20 6Z"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        fill="none"
      />
      {/* Lock icon */}
      <rect x="14" y="18" width="12" height="10" rx="2" fill="url(#shieldGradient)" />
      <path
        d="M16 18V15C16 13.3431 17.3431 12 19 12H21C22.6569 12 24 13.3431 24 15V18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="23" r="1.5" fill="white" />
    </svg>
  );
}
