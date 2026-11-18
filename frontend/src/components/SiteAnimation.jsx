import { createElement, createContext, useContext, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const AnimationContext = createContext({ animations: [], enabled: true });

export function SiteAnimationProvider({ animations, enabled, children }) {
  const value = useMemo(() => ({ animations, enabled }), [animations, enabled]);
  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

const effectStates = (config, delayIndex = 0) => {
  const distance = config.custom?.distance ?? 24;
  const scale = config.custom?.scale ?? 0.94;
  const rotation = config.custom?.rotation ?? 8;
  const initial = { opacity: 0 };
  const visible = { opacity: 1 };
  switch (config.effect) {
    case "fade-up":
    case "staggered-reveal":
      initial.y = distance;
      visible.y = 0;
      break;
    case "fade-down":
      initial.y = -distance;
      visible.y = 0;
      break;
    case "fade-left":
      initial.x = distance;
      visible.x = 0;
      break;
    case "fade-right":
    case "slide-in":
      initial.x = -distance;
      visible.x = 0;
      break;
    case "zoom-in":
      initial.scale = scale;
      visible.scale = 1;
      break;
    case "zoom-out":
      initial.scale = 1 + (1 - scale);
      visible.scale = 1;
      break;
    case "scale":
      initial.scale = scale;
      visible.scale = 1;
      break;
    case "rotate":
      initial.rotate = -rotation;
      visible.rotate = 0;
      break;
    case "bounce":
      initial.y = distance;
      visible.y = [0, -distance / 3, 0];
      break;
    case "float":
      initial.y = distance / 2;
      visible.y = [0, -distance / 2, 0];
      break;
    case "pulse":
      initial.scale = 1;
      visible.scale = [1, Math.max(scale, 1.04), 1];
      break;
    default:
      break;
  }
  const hover = {};
  if (config.effect.startsWith("fade")) hover.opacity = 0.72;
  else if (config.effect.includes("zoom") || config.effect === "scale" || config.effect === "pulse") hover.scale = Math.max(1.04, scale);
  else if (config.effect === "rotate") hover.rotate = rotation;
  else hover.y = -Math.max(4, distance / 3);
  return {
    initial,
    visible,
    hover,
    delay: config.delay + delayIndex * (config.custom?.staggerDelay ?? 0)
  };
};

export function SiteAnimation({ as = "div", animationTarget, delayIndex = 0, children, ...props }) {
  const { animations, enabled } = useContext(AnimationContext);
  const prefersReducedMotion = useReducedMotion();
  const [clicked, setClicked] = useState(false);
  const config = enabled ? animations.find((item) => item.target === animationTarget && item.enabled) : null;
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    amount: Math.min(1, Math.max(0, config?.threshold ?? 0.2))
  });
  if (!config || prefersReducedMotion) return createElement(as, props, children);

  const frames = effectStates(config, delayIndex);
  const interaction = config.trigger === "hover" || config.trigger === "click";
  const initial = interaction ? frames.visible : frames.initial;
  const animate = config.trigger === "scroll" && !inView
    ? frames.initial
    : config.trigger === "click" && clicked
      ? frames.hover
      : frames.visible;
  const transition = {
    duration: config.duration / config.speed,
    delay: frames.delay,
    ease: config.easing,
    repeat: config.iterations - 1,
    repeatType: config.direction === "normal" ? "loop" : config.direction === "reverse" ? "reverse" : "mirror"
  };
  const MotionTag = motion[as] || motion.div;
  const eventProps = config.trigger === "click"
    ? { onClick: (event) => { props.onClick?.(event); setClicked((current) => !current); } }
    : {};
  return (
    <MotionTag
      {...props}
      ref={ref}
      initial={config.trigger === "load" || config.trigger === "scroll" ? initial : false}
      animate={animate}
      whileHover={config.trigger === "hover" ? frames.hover : undefined}
      transition={transition}
      {...eventProps}
    >
      {children}
    </MotionTag>
  );
}
