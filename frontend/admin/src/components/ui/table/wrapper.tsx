import React from "react";

const TableWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div>{children}</div>;
};

export default TableWrapper;
