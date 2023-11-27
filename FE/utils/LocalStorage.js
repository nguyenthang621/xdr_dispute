export const LocalStorage = {
  getItemStorage: (name) => {
    let result = localStorage.getItem(name);
    return result ? result : null;
  },
  setItemStorage: (name, value) => {
    localStorage.setItem(name, value);
    return;
  },
  removeItemStorage: (name) => {
    localStorage.removeItem(name);
    return;
  },
  clear: () => {
    localStorage.removeItem("xdr_dispute_token");
    localStorage.removeItem("refresh_token");
    return;
  },
};
