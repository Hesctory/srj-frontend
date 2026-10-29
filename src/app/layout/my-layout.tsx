import { Suspense, type ReactNode } from "react";
import {
  AppBar,
  Sidebar,
  Loading,
  CheckForApplicationUpdate,
  TitlePortal,
  UserMenu,
} from "react-admin";
import { Box } from "@mui/material";
import { MyMenu } from "./my-menu";

/**
 * Light, slim appbar that sits ONLY above the content column (not over the
 * sidebar). `position="static"` keeps it in normal flow inside the content
 * column so the full-height sidebar owns the left edge.
 *
 * The title slot is forced to the theme's primary text color: a few resources
 * pass inline white-styled `title` spans (meant for the old dark appbar); the
 * `!important` rule keeps them legible on this bar — dark text in light mode,
 * light text in dark mode — without editing those resources.
 */
const MyAppBar = () => (
  <AppBar
    color="inherit"
    position="sticky"
    elevation={0}
    userMenu={<UserMenu />}
    sx={{
      backgroundColor: "background.paper",
      color: "text.primary",
      borderBottom: "1px solid",
      borderColor: "divider",
      "& #react-admin-title, & #react-admin-title *": (theme) => ({
        color: `${theme.palette.text.primary} !important`,
      }),
    }}
  >
    <TitlePortal />
  </AppBar>
);

/**
 * Inverted shell. RA's default Layout stacks the appbar on top (full width) and
 * clips the sidebar height below it. Here the dark sidebar spans the full height
 * on the left, and a content column (appbar + main) fills the rest.
 *
 * The scroller is `<main>`, not the document. The column is exactly one
 * viewport tall and clips, `<main>` fills what the appbar leaves and scrolls,
 * so the rail and the appbar are always on screen rather than merely sticky
 * until the page runs past them.
 *
 * That is also what lets a page scroll inside itself: `<main>` being both
 * bounded (`minHeight: 0` under a fixed-height column) and a flex column is
 * what gives a flex-height chain something to resolve against, and it is what
 * the `RaList` override in `theme.ts` needs to turn each list's content Card
 * into its own scroll region — filters and pagination pinned, rows scrolling
 * between them, and the wheel doing something wherever the pointer sits.
 * Pages that build no such chain, the CRUD forms, just overflow `<main>` and
 * scroll there instead; nothing is clipped either way.
 *
 * An earlier revision let the document scroll instead, to keep a scroller for
 * the browser to pan while zoomed — without one, a two-finger pan turned into
 * the back/forward swipe gesture. `overflow: auto` on `<main>` keeps that
 * escape hatch (it takes the horizontal overflow zoom creates); it is
 * `overflow: hidden` with no scroller anywhere that loses the gesture.
 */
export const MyLayout = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      height: "100dvh",
      overflow: "hidden",
      bgcolor: "background.default",
    }}
  >
    <Sidebar
      appBarAlwaysOn
      sx={{
        alignSelf: "flex-start",
        // A long menu scrolls in the rail rather than pushing the shell taller.
        height: "100dvh",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <MyMenu />
    </Sidebar>

    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        // `dvh`, not `vh`: on mobile browsers the toolbars retract as you scroll
        // and `100vh` would leave the pagination row parked under them.
        height: "100dvh",
      }}
    >
      <MyAppBar />
      <Box
        component="main"
        id="main-content"
        sx={{
          flex: 1,
          minWidth: 0,
          // Lets `main` shrink to what the column has left after the appbar,
          // rather than to its content — the bound the list chain resolves to.
          minHeight: 0,
          overflow: "auto",
          p: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </Box>
    </Box>

    <CheckForApplicationUpdate />
  </Box>
);
