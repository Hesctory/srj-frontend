import { useState } from "react";
import { Menu, useSidebarState } from "react-admin";
import { Box, Typography } from "@mui/material";
import {
  menu,
  menuLeaves,
  isMenuGroup,
  type MenuBadge,
  type MenuLeaf,
} from "@/app/navigation";
import { usePendingPaymentsCount } from "@/features/billing/hooks/use-pending-payments";
import SubMenu from "./sub-menu";
import { NavMenuItem, useActiveMenuPath } from "./nav-menu-item";
import logoSRJ from "../../../public/logoSRJ.png";

// Every leaf menu target. Passed to each item so "longest match wins" can break
// shared-prefix ties (e.g. so /students/reports doesn't also light up
// /students). Static — computed once.
const allMenuPaths = menuLeaves.map((leaf) => leaf.path);

const BrandHeader = () => {
  const [open] = useSidebarState();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "flex-start" : "center",
        gap: 1.25,
        px: open ? 2.5 : 0,
        height: 56,
        mb: 1,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box
        component="img"
        src={logoSRJ}
        alt="SRJ"
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          objectFit: "contain",
        }}
      />
      {open && (
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          SRJ System
        </Typography>
      )}
    </Box>
  );
};

/**
 * Resolves the live counters `navigation.tsx` asks for by name.
 *
 * The menu is static config and must stay that way, so it names a badge
 * rather than carrying a number. Every counter is fetched once here, at the
 * shell, instead of by whichever page happens to be open — the whole point of a
 * sidebar badge is that it is visible from somewhere else.
 */
const useMenuBadges = (): Record<MenuBadge, number | null> => ({
  "pending-payment-documents": usePendingPaymentsCount(),
});

export const MyMenu = () => {
  // Accordion: at most one submenu expanded, so the sidebar never grows into a
  // wall of every module's children at once.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const badges = useMenuBadges();
  const activePath = useActiveMenuPath(allMenuPaths);

  const renderLeaf = (leaf: MenuLeaf) => (
    <NavMenuItem
      key={leaf.path}
      to={leaf.path}
      primaryText={leaf.name}
      leftIcon={leaf.icon}
      allPaths={allMenuPaths}
      badge={leaf.badge ? badges[leaf.badge] : undefined}
    />
  );

  return (
    <Menu>
      <BrandHeader />
      <Menu.DashboardItem />
      {menu.map((entry) => {
        if (!isMenuGroup(entry)) return renderLeaf(entry);
        // A module with one screen is that screen: a submenu would only add a
        // click. It turns into a submenu when its second screen arrives.
        if (entry.children.length === 1) return renderLeaf(entry.children[0]);

        const isOpen = openGroup === entry.name;
        return (
          <SubMenu
            key={entry.name}
            dense={false}
            handleToggle={() =>
              setOpenGroup((prev) => (prev === entry.name ? null : entry.name))
            }
            icon={entry.icon}
            isOpen={isOpen}
            name={entry.name}
            containsActive={entry.children.some(
              (child) => child.path === activePath,
            )}
          >
            {entry.children.map(renderLeaf)}
          </SubMenu>
        );
      })}
    </Menu>
  );
};
