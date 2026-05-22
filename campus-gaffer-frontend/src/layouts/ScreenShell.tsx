import type { CSSProperties, ReactNode } from 'react';
import '../screens/screen-shared.css';

type ScreenShellProps = {
  background: string;
  color?: string;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  className?: string;
  bodyClassName?: string;
};

export function ScreenShell({
  background,
  color,
  children,
  header,
  footer,
  style,
  className,
  bodyClassName,
}: ScreenShellProps) {
  return (
    <div
      className={`screen-shell${className ? ` ${className}` : ''}`}
      style={{ background, color, ...style }}
    >
      {header ? <div className="screen-topbar">{header}</div> : null}
      <div className={`screen-scroll${bodyClassName ? ` ${bodyClassName}` : ''}`}>
        {children}
      </div>
      {footer ? <div className="screen-footer">{footer}</div> : null}
    </div>
  );
}