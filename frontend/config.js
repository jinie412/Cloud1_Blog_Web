const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

window.API_BASE_URL = isLocalhost
  ? "http://127.0.0.1:3000"
  : "http://blog-web-alb-108821261.ap-southeast-1.elb.amazonaws.com";

console.log("API base URL:", window.API_BASE_URL);
