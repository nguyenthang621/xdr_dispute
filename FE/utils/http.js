// import axios, { HttpStatusCode } from "axios";

// class Http {
//   constructor() {
//     this.accessToken = sessionStorage.getItem("xdr_dispute_token");
//     this.refreshToken = sessionStorage.getItem("refresh_token");
//     this.instance = axios.create({
//       baseURL: "http://127.0.0.1:8000",
//       // timeout: 10000,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//     this.refreshTokenRequest = null;
//     this.handleLogout = () => {
//       this.accessToken = null;
//       this.refreshToken = null;
//       sessionStorage.clear();
//       window.location.href = "/xdr-dispute/dispute#";
//     };
//     // Add a request interceptor
//     this.instance.interceptors.request.use((config) => {
//       if (this.accessToken) {
//         config.headers.authorization = 'Bearer ' + this.accessToken;
//         return config;
//       }
//       return config;
//     });

//     // Add a response interceptor
//     this.instance.interceptors.response.use(
//       async (response) => {
//         const { url } = response.config;
//         if (url === "/xdr-dispute/dispute") {
//           const data = response.data;
//           this.accessToken = data.data;
//           this.refreshToken = data.data.refresh_token;
//           sessionStorage.setItem("xdr_dispute_token", this.accessToken);
//           sessionStorage.setItem("refresh_token", this.refreshToken);

//         }
//         return response;
//       },
//       (error) => {
//         if (error?.response?.status === HttpStatusCode.InternalServerError) {
//           const data = error.response?.data;
//           if (!data) {
//             // toast.error("Server Error.");
//             return Promise.reject(error);
//           }
//           const message = data.message || error.message;
//         }
//         // Handle refresh token
//         else if (
//           error.response.status === 401 &&
//           error.response.data.message === "EXPIRED_ACCESS_TOKEN"
//         ) {
//           this.refreshTokenRequest = this.refreshTokenRequest
//             ? this.refreshTokenRequest
//             : auth.refreshToken().finally(() => {
//                 this.refreshTokenRequest = null;
//               });

//           return this.refreshTokenRequest
//             .then((data) => {
//               const { access_token, refresh_token } = data.data;
//               this.accessToken = access_token;
//               this.refreshToken = refresh_token;
//               sessionStorage.setItem("access_token", access_token);
//               sessionStorage.setItem("refresh_token", refresh_token);

//               error.response.config.Authorization = `Bearer ${access_token}`;
//               return this.instance(error.response.config); // Continue calling the API
//             })
//             .catch((refreshTokenError) => {
//               throw refreshTokenError;
//             });
//         } else if (
//           error.response.status === 401 &&
//           error.response.data.form === "REDIRECT_LOGIN"
//         ) {
//         //   this.handleLogout();
//           return;
//         }
//         return Promise.reject(error);
//       }
//     );
//   }
// }

// const http = new Http().instance;

// export default http;
