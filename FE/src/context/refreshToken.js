import axios from "axios";

export const refreshToken = async (API_URL) => {
  const storedToken = localStorage.getItem("xdr_dispute_token");
  if (!storedToken) {
    return;
  }
  try {
    const res = await axios({
      baseURL: API_URL,
      method: "POST",
      url: "/api/refresh_token/",
      data: { token: localStorage.getItem("xdr_dispute_token") },
    });
    localStorage.setItem("xdr_dispute_token", res.data.token);
    return res.data.token;
  } catch (error) {
    console.error("Error refreshing token:");
  }
};

// export const tokenRefreshInterval = 1200;
export const tokenRefreshInterval = 120000;

export const tokenExpirationDuration = 60 * 60 * 1000;
