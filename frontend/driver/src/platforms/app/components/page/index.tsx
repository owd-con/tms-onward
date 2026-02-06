import Body from "./body";
import Header from "./header";
import Footer from "./footer";
import Wrapper from "./wrapper";

export const Page = Object.assign(Wrapper, {
  Header,
  Body,
  Footer,
});
