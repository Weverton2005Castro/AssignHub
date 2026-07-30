import { create } from 'zustand';

type UiState = {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;

  toggleSidebar: () => void;
  toggleSidebarMobile: () => void;
  closeSidebarMobile: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  sidebarOpen: false,

  toggleSidebar: () =>
    set((s) => ({
      sidebarCollapsed: !s.sidebarCollapsed,
    })),

  toggleSidebarMobile: () =>
    set((s) => ({
      sidebarOpen: !s.sidebarOpen,
    })),

  closeSidebarMobile: () =>
    set({ sidebarOpen: false }),

  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
