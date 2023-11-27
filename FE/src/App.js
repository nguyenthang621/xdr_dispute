import React, { useContext, useEffect } from "react";
import { AuthContext } from "./context/auth";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Result from "./Dispute/Result";
import SubmitForm from "./Dispute/Form";
import Login from "./Login/Login";
import History from "./Dispute/History";
import Navigate from "./Sidebar/Navigate";
import {
  refreshToken,
  tokenRefreshInterval,
  tokenExpirationDuration,
} from "./context/refreshToken";
import hostPrefix from "./utils/config";

function App() {
  // const API_URL = process.env.DISPUTE_API_URL ||  "https://192.168.10.9/xdr-dispute-be";
  //const API_URL = `${window.location.origin}/xdr-dispute-be`
  const API_URL = "http://127.0.0.1:8000";

  // const API_URL = "https://10.155.19.151/xdr-dispute-be";
  const { user_token } = useContext(AuthContext);

  useEffect(() => {
    refreshToken(API_URL);

    const intervalId = setInterval(async () => {
      await refreshToken(API_URL);
    }, tokenRefreshInterval);

    const expirationTimer = setTimeout(() => {
      clearInterval(intervalId);
    }, tokenExpirationDuration);

    return () => {
      clearInterval(intervalId);
      clearTimeout(expirationTimer);
    };
  }, []);

  const homePage = user_token ? (
    <>
      <Router>
        <div className="outer-container">
          <Navigate token={user_token} API_URL={API_URL} />
          <div className="inner-container">
            <Routes>
              <Route
                path="/"
                element={<SubmitForm token={user_token} API_URL={API_URL} />}
              />
              <Route
                path={`${hostPrefix}/dispute`}
                element={<SubmitForm token={user_token} API_URL={API_URL} />}
              />
              <Route
                path={`${hostPrefix}/history`}
                element={<History token={user_token} API_URL={API_URL} />}
              />
              <Route
                path={`${hostPrefix}/dispute-detail/:id`}
                element={<Result token={user_token} API_URL={API_URL} />}
              />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  ) : (
    <>
      <Router>
        <Login APIU_RL={API_URL} />
      </Router>
    </>
  );
  return homePage;
}

export default App;
