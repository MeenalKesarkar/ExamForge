import { io } from "socket.io-client";
import { API_URL } from "../config/apiConfig";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export function createExamSocket() {
  return io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
  });
}
