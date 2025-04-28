// Update src/types/framerTypes.ts
import { framer } from "framer-plugin";

// Extend the framer plugin API with the beta permission methods
declare module 'framer-plugin' {
  interface FramerPluginAPI {
    // Beta permission APIs
    isAllowedTo?: (method: string) => Promise<boolean>;
    subscribeToIsAllowedTo?: (method: string, callback: (isAllowed: boolean) => void) => (() => void) | undefined;
    useIsAllowedTo?: (method: string) => boolean;
    
    // Selection and view methods
    setSelection: (nodeIds: string[]) => Promise<void>;
    zoomIntoView: (nodeId: string | string[], options?: { zoom?: number, duration?: number }) => Promise<void>;
    
    // Alternative methods that might be available in different Framer versions
    selectNode?: (nodeId: string) => Promise<void>;
    focusNode?: (nodeId: string) => Promise<void>;
    zoomTo?: (nodeId: string | string[]) => Promise<void>;
  }
}