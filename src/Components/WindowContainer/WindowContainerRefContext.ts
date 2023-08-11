import type {WindowContainerRef} from "./WindowContainer";
import React from "react";

export const WindowContainerRefContext = React.createContext(undefined as undefined|WindowContainerRef);

export const useWindowContainerRef = () => React.useContext(WindowContainerRefContext);
