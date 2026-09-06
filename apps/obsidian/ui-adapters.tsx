import {
  createContext,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

const RouteContext = createContext<{ location: string; navigate: (href: string) => void }>({
  location: "/",
  navigate: () => {},
});

export function RouteProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState("/");
  return (
    <RouteContext.Provider value={{ location, navigate: setLocation }}>
      {children}
    </RouteContext.Provider>
  );
}

export function usePathname() {
  return useContext(RouteContext).location.split("?")[0];
}

export function useSearchParams() {
  const { location } = useContext(RouteContext);
  return useMemo(() => new URLSearchParams(location.split("?")[1]), [location]);
}

export function useRouter() {
  const { navigate } = useContext(RouteContext);
  return useMemo(() => ({ push: navigate, replace: navigate }), [navigate]);
}

export default function Link({
  href,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
}) {
  const { navigate } = useContext(RouteContext);
  const internal = /^\/(?:notes|archive)?(?:\?|$)/.test(href);
  return (
    <a
      {...props}
      href={internal ? `#${href}` : href}
      onClick={(event) => {
        onClick?.(event);
        if (internal && !event.defaultPrevented) {
          event.preventDefault();
          navigate(href);
        }
      }}
    />
  );
}

const ThemeContext = createContext({
  theme: "light",
  mounted: true,
  toggleTheme: () => {},
});

export function ThemeProvider({
  children,
  initialDark = false,
}: {
  children: ReactNode;
  initialDark?: boolean;
}) {
  const [dark, setDark] = useState(initialDark);
  return (
    <ThemeContext.Provider
      value={{
        theme: dark ? "dark" : "light",
        mounted: true,
        toggleTheme: () => setDark((value) => !value),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
