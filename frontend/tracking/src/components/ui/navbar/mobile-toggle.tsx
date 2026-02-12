import { useEnigmaUI, Menu, type MenuItem, Drawer, Button } from "@/components";

interface NavbarMobileToggleProps {
  items: MenuItem[];
}

const HamburgerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h8m-8 6h16"
    />
  </svg>
);

export const NavbarMobileToggle = ({ items }: NavbarMobileToggleProps) => {
  const { openDrawer, closeDrawer } = useEnigmaUI();

  const handleOpen = () => {
    openDrawer({
      id: "menu",
      content: (
        <Drawer
          open={true}
          onClose={() => closeDrawer("menu")}
          className="px-5 py-10 w-3/4!"
          closeButton
          position="left"
        >
          <Menu
            items={items}
            className="bg-transparent w-full p-0"
            activeClass="bg-primary/30"
          />
        </Drawer>
      ),
    });
  };

  return (
    <Button
      onClick={handleOpen}
      size="sm"
      styleType="ghost"
      className="lg:hidden -ms-2"
    >
      <HamburgerIcon />
    </Button>
  );
};
