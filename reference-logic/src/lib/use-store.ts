import { create } from "zustand";

type State = {
  headerIdsInView: string[];
  updateHeaderIdInView: (inView: boolean, id: string) => void;
  resetHeaderIdsInView: () => void;
};

export const useStore = create<State>()((set, get) => ({
  headerIdsInView: [],
  updateHeaderIdInView: (inView: boolean, id: string) => {
    const headerIds = get().headerIdsInView;

    if (inView && !headerIds.includes(id)) {
      set({ headerIdsInView: [...headerIds, id] });
    } else {
      set({ headerIdsInView: headerIds.filter((item) => item !== id) });
    }
  },
  resetHeaderIdsInView: () => {
    set({ headerIdsInView: [] });
  },
}));
