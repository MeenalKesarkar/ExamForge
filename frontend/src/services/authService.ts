interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
}

interface LoginResponse {
  message: string;
  token: string;
  user: LoginUser;
}

const API_URL = "http://localhost:5000/api";

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};