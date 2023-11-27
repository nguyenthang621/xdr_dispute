import React, { createContext, useReducer } from "react";

import jwtDecode from "jwt-decode";
const initialState = {
  user_token: null,
};

if (localStorage.getItem("xdr_dispute_token")) {
  const token = localStorage.getItem("xdr_dispute_token");
  const decodedToken = jwtDecode(token);
  if (decodedToken.exp * 1000 < Date.now()) {
    localStorage.removeItem("xdr_dispute_token");
  } else {
    initialState.user_token = token;
  }
}

const AuthContext = createContext({
  user_token: null,
  login: (token) => {},
  logout: () => {},
});

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user_token: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user_token: null,
      };
    default:
      return state;
  }
}

function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  function login(token) {
    localStorage.setItem("xdr_dispute_token", token);
    dispatch({
      type: "LOGIN",
      payload: token,
    });
  }
  function logout() {
    localStorage.removeItem("xdr_dispute_token");
    dispatch({
      type: "LOGOUT ",
    });
    window.location.reload();
  }
  return (
    <AuthContext.Provider
      value={{ user_token: state.user_token, login, logout }}
      {...props}
    />
  );
}

export { AuthContext, AuthProvider };
