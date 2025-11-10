/* src/services/AuthService.js */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8082";

function withBase(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export const AuthService = {
  async getExistingRoles() {
    try {
      const res = await fetch(withBase("/roles"), {
        credentials: "include",
      });

      if (res.ok) {
        const roles = await res.json();
        console.log("Available roles:", roles);
        return roles;
      }
      throw new Error(`Failed to fetch roles: ${res.status}`);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      throw error;
    }
  },

  async registerUser({ username, email, password, role }) {
    // First, get the existing roles to find the correct role ID
    const roles = await this.getExistingRoles();

    // Find the role that matches the selected role name
    const existingRole = roles.find((r) => r.name === role);

    if (!existingRole) {
      throw new Error(
          `Role '${role}' not found in database. Available roles: ${roles
              .map((r) => r.name)
              .join(", ")}`
      );
    }

    // Use the existing role with its ID
    const payload = {
      username,
      email,
      passwordHash: password,
      role: {
        id: existingRole.id,
        name: existingRole.name,
      },
    };

    console.log("Sending user payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(withBase("/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        // Read text once and try to parse JSON from it
        const text = await res.text();
        let errorMsg = `Registration failed: ${res.status} ${res.statusText}`;
        try {
          const errorData = text ? JSON.parse(text) : null;
          if (errorData) errorMsg = errorData.message || JSON.stringify(errorData);
          else errorMsg = text || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const userData = await res.json();
      console.log("User created successfully:", userData);
      return userData;
    } catch (error) {
      console.error("User registration error:", error);
      throw error;
    }
  },

  async createPetOwner({ userId, firstName, lastName, phone }) {
    const payload = {
      user: { id: userId },
      firstName,
      lastName,
      phone: phone || "",
    };

    console.log("Creating pet owner with:", payload);

    try {
      const res = await fetch(withBase("/pet-owners"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        // Read text once and try to parse JSON from it
        const text = await res.text();
        let errorMsg = `Pet owner creation failed: ${res.status}`;
        try {
          const errorData = text ? JSON.parse(text) : null;
          if (errorData) errorMsg = errorData.message || JSON.stringify(errorData);
          else errorMsg = text || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const petOwnerData = await res.json();
      console.log("Pet owner created successfully:", petOwnerData);
      return petOwnerData;
    } catch (error) {
      console.error("Pet owner creation error:", error);
      throw error;
    }
  },

  async register({
                    username,
                    email,
                    password,
                    role,
                    firstName,
                    lastName,
                    phone,
                  }) {
    // First, create the user with the existing role
    const user = await this.registerUser({
      username,
      email,
      password,
      role,
    });

    // Attempt an immediate login so subsequent requests are authenticated
    try {
      // Call login to establish credentials (cookies / token)
      await this.login({ usernameOrEmail: email, password, remember: false });
    } catch (loginErr) {
      console.warn("Automatic login after registration failed:", loginErr);
      // Continue: even if automatic login fails, we still attempt to create pet owner
    }

    // If the role is PET_OWNER, create the pet owner record (authenticated)
    if (role === "PET_OWNER") {
      await this.createPetOwner({
        userId: user.id,
        firstName,
        lastName,
        phone,
      });
    }

    return user;
  },

  async login({ usernameOrEmail, password, remember }) {
    const res = await fetch(withBase("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: usernameOrEmail, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const body = text ? JSON.parse(text) : { error: text };
        throw new Error(body.error || JSON.stringify(body));
      } catch (e) {
        // not JSON
        throw new Error(text || `Login failed: ${res.status}`);
      }
    }

    const data = await res.json();

    // Case 1: MFA required
    if (data.mfaRequired && data.mfaToken) {
      return { mfaRequired: true, mfaToken: data.mfaToken };
    }

    // Case 2: Legacy success without MFA (TokenResponse { token })
    if (data.token) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("access_token", data.token);
      // Best effort: keep API compatibility for existing views expecting a user
      const fallbackUser = { username: usernameOrEmail, email: usernameOrEmail };
      storage.setItem("current_user", JSON.stringify(fallbackUser));
      sessionStorage.setItem("current_user", JSON.stringify(fallbackUser));
      return { user: fallbackUser, token: data.token };
    }

    // Case: new JWT token response from /api/auth/login ({ token } or accessToken etc.)
    if (data.accessToken) {
      // store as before
      localStorage.setItem('access_token', data.accessToken);
      sessionStorage.setItem('access_token', data.accessToken);
      const claims = (function(){ try { const p = data.accessToken.split('.')[1]; return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))) } catch { return null } })();
      const fallbackUser = { username: claims?.email?.split('@')[0] || usernameOrEmail, email: claims?.email || usernameOrEmail };
      sessionStorage.setItem('current_user', JSON.stringify(fallbackUser));
      localStorage.setItem('current_user', JSON.stringify(fallbackUser));
      return { user: fallbackUser, token: data.accessToken };
    }

    return data;
  },

  // Add this method to AuthService if roles need to be created
  async ensureRolesExist() {
    try {
      const roles = await this.getExistingRoles();

      // If no roles exist, create them
      if (roles.length === 0) {
        console.log("No roles found, creating default roles...");
        const defaultRoles = ["PET_OWNER", "CLINIC_ADMIN", "ASSISTANT", "VET"];

        for (const roleName of defaultRoles) {
          await fetch(withBase("/roles"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: roleName }),
            credentials: "include",
          });
        }
        console.log("Default roles created");
      }
    } catch (error) {
      console.error("Error ensuring roles exist:", error);
    }
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("current_user");
  },

  getToken() {
    return (
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token")
    );
  },

  getCurrentUser() {
    const raw =
        sessionStorage.getItem("current_user") ||
        localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  authHeader() {
    const t = this.getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
};
