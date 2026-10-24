import type { ReactElement } from "react";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SchoolIcon from "@mui/icons-material/School";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InventoryIcon from "@mui/icons-material/Inventory";
import GroupIcon from "@mui/icons-material/Group";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GradeIcon from "@mui/icons-material/Grade";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SettingsIcon from "@mui/icons-material/Settings";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import SavingsIcon from "@mui/icons-material/Savings";
import CategoryIcon from "@mui/icons-material/Category";
import WorkIcon from "@mui/icons-material/Work";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PaymentsIcon from "@mui/icons-material/Payments";
import LayersIcon from "@mui/icons-material/Layers";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

/**
 * Names a live counter the sidebar renders as a badge on this item. The menu
 * resolves it (see `MyMenu`); this config only says which item wants one, so a
 * static tree stays static.
 */
export type MenuBadge = "pending-payment-documents";

/** A screen. `path` is a resource (`/<name>`) or a custom route. */
export type MenuLeaf = {
  name: string;
  path: string;
  icon: ReactElement;
  badge?: MenuBadge;
};

/** A module. With a single child it renders as that child (see `MyMenu`). */
export type MenuGroup = {
  name: string;
  icon: ReactElement;
  children: MenuLeaf[];
};

export type MenuEntry = MenuLeaf | MenuGroup;

export const isMenuGroup = (entry: MenuEntry): entry is MenuGroup =>
  "children" in entry;

/**
 * The sidebar, ordered by how often each module is used: counter work first,
 * setup last. Only screens that work belong here — a screen without an API
 * contract does not get a menu entry (the navigation test enforces that every
 * entry resolves to a registered page and every page is reachable).
 *
 * Setup lists edited a few times a year sit under Académico or Configuración,
 * even when another feature owns their code (series → billing, áreas and
 * cargos → staff, editoriales → products).
 */
export const menu: MenuEntry[] = [
  {
    name: "Caja",
    icon: <PointOfSaleIcon />,
    children: [
      { name: "Pensiones", path: "/cashier/tuition", icon: <PaymentsIcon /> },
    ],
  },
  {
    name: "Comprobantes",
    path: "/payment-documents",
    icon: <ReceiptLongIcon />,
    badge: "pending-payment-documents",
  },
  {
    name: "Estudiantes",
    icon: <SchoolIcon />,
    children: [
      { name: "Estudiantes", path: "/students", icon: <PersonAddIcon /> },
      {
        name: "Reportes",
        path: "/students/reports",
        icon: <PictureAsPdfIcon />,
      },
    ],
  },
  {
    name: "Productos",
    icon: <InventoryIcon />,
    children: [
      { name: "Productos", path: "/products", icon: <InventoryIcon /> },
    ],
  },
  { name: "Personal", path: "/staff-members", icon: <GroupIcon /> },
  {
    name: "Académico",
    icon: <AccountTreeIcon />,
    children: [
      {
        name: "Años escolares",
        path: "/school-years",
        icon: <CalendarTodayIcon />,
      },
      { name: "Niveles", path: "/levels", icon: <LayersIcon /> },
      { name: "Grados", path: "/grades", icon: <GradeIcon /> },
      {
        name: "Oferta de grados",
        path: "/grade-offerings",
        icon: <ViewModuleIcon />,
      },
      { name: "Aulas", path: "/classrooms", icon: <MeetingRoomIcon /> },
      { name: "Tarifas", path: "/costs", icon: <AttachMoneyIcon /> },
    ],
  },
  {
    name: "Configuración",
    icon: <SettingsIcon />,
    children: [
      {
        name: "Instituciones",
        path: "/institutions",
        icon: <CorporateFareIcon />,
      },
      {
        name: "Series",
        path: "/voucher-series",
        icon: <FormatListNumberedIcon />,
      },
      {
        name: "Plan contable",
        path: "/accounting-plan",
        icon: <SavingsIcon />,
      },
      { name: "Áreas de trabajo", path: "/work-areas", icon: <CategoryIcon /> },
      { name: "Cargos de trabajo", path: "/job-positions", icon: <WorkIcon /> },
      { name: "Editoriales", path: "/publishers", icon: <MenuBookIcon /> },
    ],
  },
];

/** Every screen the menu links to, flattened. */
export const menuLeaves: MenuLeaf[] = menu.flatMap((entry) =>
  isMenuGroup(entry) ? entry.children : [entry],
);
