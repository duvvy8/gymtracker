import { useEffect, useRef, useState, type ReactElement } from 'react';

export interface ChartSize {
  width: number;
  height: number;
}

/**
 * Measures a box and reports its size, shrinking as well as growing.
 *
 * This replaces Recharts' ResponsiveContainer, which was observed leaving a
 * stale inline width on its inner wrapper when the viewport narrowed: the
 * whole ancestor chain measured 309 px while the chart stayed pinned at
 * 419 px and pushed a horizontal scrollbar onto the page that no further
 * narrowing removed. Measuring here and passing explicit dimensions to the
 * chart removes that failure mode entirely.
 */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const measure = () => {
      setSize((current) => {
        const width = Math.max(0, Math.floor(element.clientWidth));
        const height = Math.max(0, Math.floor(element.clientHeight));
        return current.width === width && current.height === height ? current : { width, height };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

/**
 * The sized box every chart lives in.
 *
 * min-w-0 is what lets the box shrink at all. A grid or flex ancestor
 * defaults to min-width: auto, which will not go below the intrinsic width
 * of its content.
 *
 * The description is a figcaption rather than role="img" on the wrapper.
 * Recharts marks its own SVG tabbable and provides keyboard navigation of
 * the data; role="img" would flatten that subtree into a single image and
 * leave a focus stop inside something announced as a picture. The figures
 * behind every chart are also printed as text above it.
 */
export function ChartCanvas({
  ariaLabel,
  children,
  tall = false,
}: {
  ariaLabel: string;
  children: (size: ChartSize) => ReactElement;
  tall?: boolean;
}) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{ariaLabel}</figcaption>
      <div ref={ref} className={`w-full min-w-0 ${tall ? 'h-64 sm:h-80' : 'h-56 sm:h-72'}`}>
        {size.width > 0 && size.height > 0 ? children(size) : null}
      </div>
    </figure>
  );
}
