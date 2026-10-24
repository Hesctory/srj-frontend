import { forwardRef, type ReactElement, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MenuItem,
  ListItemIcon,
  Typography,
  Tooltip,
  Box,
  useMediaQuery,
  type Theme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import clsx from "clsx";
import { useSidebarState } from "react-admin";

/**
 * Drop-in replacement for RA's `<Menu.Item>` that fixes the shared-prefix
 * highlight bug.
 *
 * RA's MenuItemLink flags a link active with `useMatch({ path: to, end: false })`,
 * i.e. prefix matching — so `/students` also matches `/students/reports` and both
 * items light up. Here we resolve active state with "longest match wins": among
 * every menu target that matches the current URL, only the most specific one is
 * active. Parent CRUD sub-routes (`/students/create`) still highlight their item,
 * while a more specific sibling (`/students/reports`) takes over on its own pages.
 *
 * We reuse RA's `RaMenuItemLink-*` class names via a same-named styled component,
 * so the theme's menu styling (colors, active glow, left bar) applies unchanged.
 */

const PREFIX = "RaMenuItemLink";
const classes = {
  root: `${PREFIX}-root`,
  active: `${PREFIX}-active`,
  icon: `${PREFIX}-icon`,
};

// Named `RaMenuItemLink` so theme.components.RaMenuItemLink.styleOverrides applies.
const StyledMenuItem = styled(MenuItem, {
  name: PREFIX,
  overridesResolver: (_props, styles) => styles.root,
})({}) as typeof MenuItem; // keep MenuItem's polymorphic `component` prop

const matches = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(to.endsWith("/") ? to : `${to}/`);

/**
 * The single menu target the current URL resolves to: the most specific match
 * among every leaf menu target, so ties are broken by length. `null` when the
 * URL belongs to no menu entry.
 *
 * Exported because the sidebar also needs it one level up — a collapsed submenu
 * highlights itself when the active leaf is one of its children.
 */
export const useActiveMenuPath = (allPaths: string[]) => {
  const { pathname } = useLocation();
  const candidates = allPaths.filter((p) => matches(pathname, p));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (b.length > a.length ? b : a));
};

interface Props {
  to: string;
  primaryText: string;
  leftIcon?: ReactElement;
  /** Every leaf menu target, used to break shared-prefix ties. */
  allPaths: string[];
  /**
   * Live counter shown at the trailing edge. Rendered only when it is a
   * positive number, so a still-loading or failed count is simply absent — a
   * badge reading "0" is noise, and one that never resolves must not linger.
   */
  badge?: number | null;
}

export const NavMenuItem = forwardRef<HTMLAnchorElement, Props>(
  ({ to, primaryText, leftIcon, allPaths, badge }, ref) => {
    const [sidebarOpen, setSidebarOpen] = useSidebarState();
    const isSmall = useMediaQuery<Theme>((theme) =>
      theme.breakpoints.down("md"),
    );
    const active = useActiveMenuPath(allPaths) === to;

    const item: ReactNode = (
      <StyledMenuItem
        ref={ref}
        component={Link}
        to={to}
        tabIndex={0}
        onClick={() => isSmall && setSidebarOpen(false)}
        className={clsx(classes.root, { [classes.active]: active })}
      >
        {leftIcon && (
          <ListItemIcon className={classes.icon}>{leftIcon}</ListItemIcon>
        )}
        <Typography variant="inherit" noWrap sx={{ flexGrow: 1 }}>
          {primaryText}
        </Typography>
        {typeof badge === "number" && badge > 0 && (
          <Box
            component="span"
            sx={{
              ml: 1,
              minWidth: 18,
              height: 18,
              px: 0.625,
              borderRadius: 9,
              backgroundColor: "error.main",
              color: "error.contrastText",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: "18px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            {badge}
          </Box>
        )}
      </StyledMenuItem>
    );

    if (sidebarOpen) return item;

    return (
      <Tooltip title={primaryText} placement="right">
        {item}
      </Tooltip>
    );
  },
);

NavMenuItem.displayName = "NavMenuItem";
