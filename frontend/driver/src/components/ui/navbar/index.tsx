import { Navbar as BaseNavbar } from "./navbar";
import { NavbarBrand } from "./brand";
import { NavbarNavigation } from "./navigation";
import { NavbarActions } from "./actions";
import { NavbarMobileToggle } from "./mobile-toggle";

export const Navbar = Object.assign(BaseNavbar, {
  Brand: NavbarBrand,
  Navigation: NavbarNavigation,
  Actions: NavbarActions,
  MobileToggle: NavbarMobileToggle,
});
