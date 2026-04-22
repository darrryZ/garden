declare namespace React {
  type ReactNode = any;
  type ReactElement = any;
  type ElementRef<T = any> = any;
  type ComponentProps<T = any> = any;
  type ComponentPropsWithoutRef<T = any> = any;
  type HTMLAttributes<T = any> = any;
  type InputHTMLAttributes<T = any> = any;
  type TextareaHTMLAttributes<T = any> = any;
  type MouseEvent<T = any> = any;
  type ChangeEvent<T = any> = any;
  type FormEvent<T = any> = any;
  type KeyboardEvent<T = any> = any;
  function createContext<T = any>(value?: T): any;
  const StrictMode: any;
  function useContext<T = any>(context: any): T;
  function useState<T = any>(value: T | (() => T)): [T, (value: any) => void];
  function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  function useRef<T = any>(value?: T): { current: T };
  function useMemo<T = any>(factory: () => T, deps?: any[]): T;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
}

declare module 'react' {
  export = React;
}

declare module 'vitest' {
  export const describe: any;
  export const it: any;
  export const expect: any;
}

declare module 'fast-check' {
  const fc: any;
  export = fc;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(node: any): void;
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
