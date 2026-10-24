import { TabbedForm, TabbedFormTabs } from "ra-ui-materialui";
import type { TabbedFormProps } from "react-admin";

/**
 * TabbedForm with scrollable tab headers.
 *
 * React-admin's default TabbedForm renders tabs with `overflow: hidden` and no
 * scroll buttons, so on narrow viewports some tabs become unreachable. This
 * wrapper enables MUI scrollable tabs so all tab labels remain accessible at
 * any width.
 */
export const ScrollableTabbedForm = (props: TabbedFormProps) => (
  <TabbedForm
    {...props}
    tabs={
      <TabbedFormTabs
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      />
    }
  />
);

ScrollableTabbedForm.Tab = TabbedForm.Tab;

export default ScrollableTabbedForm;
