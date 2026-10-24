import { ReactElement, ReactNode } from "react";
import {
  List,
  MenuItem,
  ListItemIcon,
  Typography,
  Collapse,
  Tooltip,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useSidebarState } from "react-admin";

interface Props {
  dense: boolean;
  handleToggle: () => void;
  icon: ReactElement;
  isOpen: boolean;
  name: string;
  /**
   * True when the current page is one of this submenu's children. Only shown
   * while collapsed: once expanded, the child item carries the highlight itself
   * and repeating it on the header would just be noise.
   */
  containsActive?: boolean;
  children: ReactNode;
}

const SubMenu = (props: Props) => {
  const { handleToggle, isOpen, name, icon, children, dense, containsActive } =
    props;
  const [sidebarIsOpen] = useSidebarState();
  const highlighted = Boolean(containsActive) && !isOpen;

  const header = (
    <MenuItem
      dense={dense}
      onClick={handleToggle}
      sx={(theme) => ({
        color: "rgba(255,255,255,0.72)",
        borderRadius: 2,
        mx: 1,
        my: "2px",
        borderLeft: "3px solid transparent",
        "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", color: "#fff" },
        ...(highlighted && {
          color: "#fff",
          fontWeight: 600,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(129,140,248,0.28)"
              : "rgba(36,86,214,0.22)",
          borderLeft: `3px solid ${theme.palette.primary.main}`,
        }),
      })}
    >
      <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
        {isOpen ? <ExpandMore /> : icon}
      </ListItemIcon>
      {sidebarIsOpen && (
        <Typography
          variant="inherit"
          color="inherit"
          noWrap
          sx={{ fontWeight: 500, flexGrow: 1 }}
        >
          {name}
        </Typography>
      )}
    </MenuItem>
  );

  return (
    <div>
      {sidebarIsOpen || isOpen ? (
        header
      ) : (
        <Tooltip title={name} placement="right">
          {header}
        </Tooltip>
      )}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List
          dense={dense}
          component="div"
          disablePadding
          className="SubMenu"
          sx={{
            "& .MuiMenuItem-root": {
              transition: "padding-left 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms",
              paddingLeft: (theme) =>
                sidebarIsOpen ? theme.spacing(4) : theme.spacing(2),
            },
          }}
        >
          {children}
        </List>
      </Collapse>
    </div>
  );
};

export default SubMenu;
