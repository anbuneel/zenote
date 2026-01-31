
interface LogoProps {
    className?: string;
    onClick?: () => void;
}

export function Logo({ className = '', onClick }: LogoProps) {
    // Using an img tag pointing to the public asset to avoid large DOM size
    return (
        <img
            src="/yidhan-logo.svg"
            alt="Yidhan Logo"
            className={`select-none ${className}`}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                objectFit: 'contain'
            }}
        />
    );
}
