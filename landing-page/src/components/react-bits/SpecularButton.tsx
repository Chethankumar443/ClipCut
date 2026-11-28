'use client';

import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion, subscribeReducedMotion } from '../../lib/modernWeb';

import './SpecularButton.css';

const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const wrap = (value: number) => value - Math.floor(value);

const loopPosition = (x: number, y: number, halfX: number, halfY: number, r: number) => {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const qx = ax - innerX;
  const qy = ay - innerY;
  let s: number;
  if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
  else if (qx > qy) s = Math.min(ay, innerY);
  else s = innerY + arc + innerX - Math.min(ax, innerX);
  if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
  else if (y < 0) s = 4 * quarter - s;
  return wrap(s / Math.max(4 * quarter, 0.0001));
};

const rimPoint = (position: number, halfX: number, halfY: number, r: number): [number, number] => {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  let s = wrap(position) * 4 * quarter;
  let signX = 1;
  let signY = 1;
  if (s > 3 * quarter) {
    s = 4 * quarter - s;
    signY = -1;
  } else if (s > 2 * quarter) {
    s -= 2 * quarter;
    signX = -1;
    signY = -1;
  } else if (s > quarter) {
    s = 2 * quarter - s;
    signX = -1;
  }
  let x = innerX - (s - innerY - arc);
  let y = halfY;
  if (s <= innerY) {
    x = halfX;
    y = s;
  } else if (s <= innerY + arc) {
    const angle = (s - innerY) / Math.max(r, 0.0001);
    x = innerX + Math.cos(angle) * r;
    y = innerY + Math.sin(angle) * r;
  }
  return [x * signX, y * signY];
};

export interface SpecularButtonProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  idleIntensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  glow?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  rel?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const SpecularButton = ({
  children = 'Get Started',
  size = 'lg',
  radius = 18,
  tint = '#ffffff',
  tintOpacity = 0.04,
  blur = 0,
  textColor = '#f5f5f5',
  lineColor = '#ffffff',
  baseColor = '#525252',
  intensity = 1,
  idleIntensity = 0.35,
  shineSize = 10,
  shineFade = 34,
  thickness = 1.2,
  glow = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  href,
  target,
  rel,
  style,
  ...rest
}: SpecularButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    radius: Math.max(0, radius),
    lineColor: String(lineColor),
    baseColor: String(baseColor),
    intensity: Math.max(0, intensity),
    idleIntensity: clamp(idleIntensity, 0, 1),
    shineSize: Math.max(0, shineSize),
    shineFade: Math.max(0, shineFade),
    thickness: Math.max(0.5, thickness),
    glow: Math.max(0, glow),
    speed,
    followMouse,
    proximity: Math.max(1, proximity),
    autoAnimate,
    disabled,
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return undefined;

    let reduce = prefersReducedMotion();
    const view = { width: Math.max(1, button.offsetWidth), height: Math.max(1, button.offsetHeight) };
    const pointer = { x: 0, y: 0, known: false };
    const state = { spot: 0, level: 0, press: 0, ready: false };
    let cachedRect: DOMRect | null = null;
    let raf = 0;
    let last = 0;
    let visible = true;

    const cornerRadius = (s: typeof settings) => Math.min(s.radius, view.width / 2, view.height / 2);

    const restSpot = (s: typeof settings) => {
      const r = cornerRadius(s);
      const inset = r * (1 - Math.SQRT1_2);
      return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, r);
    };

    const aim = (s: typeof settings) => {
      if (!s.followMouse || s.disabled || !pointer.known || reduce) return null;
      const rect = cachedRect ?? (cachedRect = button.getBoundingClientRect());
      const scale = rect.width / view.width || 1;
      const halfX = view.width / 2;
      const halfY = view.height / 2;
      const x = (pointer.x - rect.left - rect.width / 2) / scale;
      const y = (rect.top + rect.height / 2 - pointer.y) / scale;
      const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
      const t = clamp(1 - distance / s.proximity, 0, 1);
      const near = t * t * (3 - 2 * t);
      const nearest = loopPosition(x, y, halfX, halfY, cornerRadius(s));
      if (distance > 0) return { spot: nearest, near };
      const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
      const sway = restSpot(s) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
      const offset = sway - nearest - Math.round(sway - nearest);
      return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near };
    };

    const paint = (s: typeof settings) => {
      const { width, height } = view;
      const r = cornerRadius(s);
      const [rimX, rimY] = rimPoint(state.spot, width / 2, height / 2, r);
      const hypot = Math.hypot(rimX, rimY);
      const pull = 1 - Math.min(0.35 * (height / 2), hypot) / Math.max(hypot, 0.0001);

      const spotX = width / 2 + rimX;
      const spotY = height / 2 - rimY;
      const oppX = width / 2 - rimX;
      const oppY = height / 2 + rimY;
      const entryX = width / 2 + rimX * pull;
      const entryY = height / 2 - rimY * pull;

      const activeLevel = s.intensity * (state.level + state.press * 0.8);
      const keyAlpha = clamp(activeLevel, 0, 1);
      const backAlpha = clamp(activeLevel * 0.45, 0, 0.7);
      const poolAlpha = clamp(0.11 * s.glow * activeLevel, 0, 0.35);
      const span = ((s.shineSize + s.shineFade) / 360 + state.press * 0.06) * (width + height);

      button.style.setProperty('--sb-x', `${spotX.toFixed(1)}px`);
      button.style.setProperty('--sb-y', `${spotY.toFixed(1)}px`);
      button.style.setProperty('--sb-opp-x', `${oppX.toFixed(1)}px`);
      button.style.setProperty('--sb-opp-y', `${oppY.toFixed(1)}px`);
      button.style.setProperty('--sb-entry-x', `${entryX.toFixed(1)}px`);
      button.style.setProperty('--sb-entry-y', `${entryY.toFixed(1)}px`);
      button.style.setProperty('--sb-spot-w', `${Math.max(44, span * 1.4).toFixed(1)}px`);
      button.style.setProperty('--sb-spot-h', `${Math.max(34, height * 0.95 + state.press * 14).toFixed(1)}px`);
      button.style.setProperty('--sb-key-alpha', keyAlpha.toFixed(3));
      button.style.setProperty('--sb-back-alpha', backAlpha.toFixed(3));
      button.style.setProperty('--sb-pool-alpha', poolAlpha.toFixed(3));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = aim(s);
      const spinning = s.autoAnimate && !reduce;
      const steering = !!target && target.near > 0;
      if (!state.ready) {
        state.spot = restSpot(s);
        state.level = s.autoAnimate ? 1 : s.idleIntensity;
        state.ready = true;
      }
      let diff = 0;
      if (spinning && !steering) state.spot = wrap(state.spot + (s.speed / TAU) * dt);
      else {
        diff = (steering ? target!.spot : restSpot(s)) - state.spot;
        diff -= Math.round(diff);
        state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));
      }
      const level = s.autoAnimate ? 1 : s.idleIntensity + (1 - s.idleIntensity) * (target ? target.near : 0);
      state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
      state.press *= Math.exp(-dt * 5);
      paint(s);
      const settling = Math.abs(diff) > 0.0002 || Math.abs(level - state.level) > 0.001 || state.press > 0.002;
      if (settling || (spinning && !steering)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const invalidateRect = () => {
      cachedRect = null;
    };

    const measure = (entry?: ResizeObserverEntry) => {
      invalidateRect();
      const box = entry?.borderBoxSize?.[0];
      view.width = Math.max(1, box ? box.inlineSize : button.offsetWidth);
      view.height = Math.max(1, box ? box.blockSize : button.offsetHeight);
      if (state.ready) paint(settingsRef.current);
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      if (!settingsRef.current.disabled) state.press = 1;
      wake();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      pointer.known = false;
      wake();
    };

    const onPointerLeave = () => {
      pointer.known = false;
      wake();
    };

    const unsubReduce = subscribeReducedMotion((matches) => {
      reduce = matches;
      last = 0;
      wake();
    });
    const onVisibility = () => {
      if (!document.hidden) {
        last = 0;
        wake();
      }
    };

    const resizeObserver = new ResizeObserver((entries) => measure(entries[entries.length - 1]));
    resizeObserver.observe(button);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        invalidateRect();
        last = 0;
        wake();
      }
    });
    intersection.observe(button);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    window.addEventListener('scroll', invalidateRect, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    button.addEventListener('pointerdown', onPointerDown);
    measure();
    wakeRef.current = wake;

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      unsubReduce();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('scroll', invalidateRect);
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      button.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  const initialKeyAlpha = clamp(intensity * idleIntensity, 0, 1);
  const sharedStyle = {
    '--sb-radius': `${radius}px`,
    '--sb-tint': tint,
    '--sb-tint-opacity': tintOpacity,
    '--sb-blur': `${blur}px`,
    '--sb-text-color': textColor,
    '--sb-line-color': lineColor,
    '--sb-base-color': baseColor,
    '--sb-thickness': `${Math.max(1, thickness)}px`,
    '--sb-key-alpha': initialKeyAlpha.toFixed(3),
    '--sb-back-alpha': (initialKeyAlpha * 0.45).toFixed(3),
    '--sb-pool-alpha': clamp(0.11 * glow * initialKeyAlpha, 0, 0.35).toFixed(3),
    ...style,
  } as React.CSSProperties;

  const classes = `specular-button specular-button--${size}${className ? ` ${className}` : ''}`;

  if (href) {
    return (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={classes}
        style={sharedStyle}
        {...rest}
      >
        <span className="specular-button__rim" aria-hidden="true" />
        <span className="specular-button__pool" aria-hidden="true" />
        <span className="specular-button__label">{children}</span>
      </a>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      style={sharedStyle}
      {...rest}
    >
      <span className="specular-button__rim" aria-hidden="true" />
      <span className="specular-button__pool" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
};

export default SpecularButton;
