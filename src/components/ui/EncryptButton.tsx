'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const CYCLES_PER_CHAR = 4;
const SHUFFLE_SPEED = 28;
const SCRAMBLE_CHARS = '010101_!@#$%^&*()<>{}[]░▒▓█ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface EncryptButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  text?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  variant?: 'primary' | 'ghost';
}

const EncryptButton = React.forwardRef<HTMLButtonElement, EncryptButtonProps>(
  ({ text, className, children, icon, showIcon = true, variant = 'primary', onMouseEnter, onMouseLeave, ...props }, ref) => {
    const labelText = (typeof children === 'string' ? children : text) || 'Encrypt';
    const [displayText, setDisplayText] = React.useState(labelText);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isDecrypted, setIsDecrypted] = React.useState(false);
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const stopScramble = React.useCallback(() => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setDisplayText(labelText);
      setIsDecrypted(false);
    }, [labelText]);

    const startScramble = React.useCallback(() => {
      stopScramble();
      let step = 0;
      const totalSteps = labelText.length * CYCLES_PER_CHAR;
      intervalRef.current = setInterval(() => {
        setDisplayText(
          labelText.split('').map((char, index) => {
            if (char === ' ') return ' ';
            if (step / CYCLES_PER_CHAR > index) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }).join('')
        );
        step++;
        if (step > totalSteps) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setDisplayText(labelText);
          setIsDecrypted(true);
        }
      }, SHUFFLE_SPEED);
    }, [labelText, stopScramble]);

    const baseStyle = variant === 'primary'
      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626]/40 shadow-[0_0_28px_rgba(220,38,38,0.3)]'
      : 'bg-transparent text-white border border-white/10 hover:border-white/25 hover:bg-white/5';

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={(e) => { setIsHovered(true); startScramble(); onMouseEnter?.(e as unknown as React.MouseEvent<HTMLButtonElement>); }}
        onMouseLeave={(e) => { setIsHovered(false); stopScramble(); onMouseLeave?.(e as unknown as React.MouseEvent<HTMLButtonElement>); }}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-sm px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200 select-none cursor-pointer outline-none',
          baseStyle,
          className
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {/* Corner accents */}
        <span className="absolute top-1 left-1 size-1.5 border-t border-l border-white/20 transition-all duration-300 group-hover:size-2.5 group-hover:border-white/50" />
        <span className="absolute top-1 right-1 size-1.5 border-t border-r border-white/20 transition-all duration-300 group-hover:size-2.5 group-hover:border-white/50" />
        <span className="absolute bottom-1 left-1 size-1.5 border-b border-l border-white/20 transition-all duration-300 group-hover:size-2.5 group-hover:border-white/50" />
        <span className="absolute bottom-1 right-1 size-1.5 border-b border-r border-white/20 transition-all duration-300 group-hover:size-2.5 group-hover:border-white/50" />

        {/* Shimmer sweep */}
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ x: '-100%' }} animate={{ x: '200%' }} exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        {showIcon && (
          <span className="relative z-10 flex items-center justify-center w-4">
            {icon ?? (
              <AnimatePresence mode="wait" initial={false}>
                {isDecrypted
                  ? <motion.span key="u" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}><Unlock className="size-3.5" /></motion.span>
                  : isHovered
                  ? <motion.span key="t" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.12 }}><Terminal className="size-3.5 animate-pulse" /></motion.span>
                  : <motion.span key="l" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.12 }}><Lock className="size-3.5 opacity-60" /></motion.span>
                }
              </AnimatePresence>
            )}
          </span>
        )}

        {/* Text */}
        <span className="relative z-10 inline-flex items-center justify-center">
          <span className="opacity-0 pointer-events-none" aria-hidden>{labelText}</span>
          <span className="absolute inset-0 flex items-center justify-center font-mono">{displayText}</span>
        </span>
      </motion.button>
    );
  }
);
EncryptButton.displayName = 'EncryptButton';
export { EncryptButton };
