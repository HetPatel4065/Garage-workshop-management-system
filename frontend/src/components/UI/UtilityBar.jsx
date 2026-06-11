import React from "react";

const UtilityBar = ({ children }) => {
  return <div className="mb-6 flex flex-col lg:flex-row gap-4">{children}</div>;
};

export default UtilityBar;
