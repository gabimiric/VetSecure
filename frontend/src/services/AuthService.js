/* src/services/AuthService.js */
export const AuthService = {
  async getExistingRoles() {
    try {
      const res = await fetch("/roles", {
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
      const res = await fetch("/users", {
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
        let errorMsg = `Registration failed: ${res.status} ${res.statusText}`;

        try {
          const errorData = await res.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          const text = await res.text();
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
      const res = await fetch("/pet-owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMsg = `Pet owner creation failed: ${res.status}`;

        try {
          const errorData = await res.json();
          errorMsg = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          const text = await res.text();
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

    // If the role is PET_OWNER, create the pet owner record
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
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Login failed: ${res.status}`);
    }

    const data = await res.json();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("access_token", data.token);
    storage.setItem("current_user", JSON.stringify(data.user));
    sessionStorage.setItem("current_user", JSON.stringify(data.user));
    return data.user;
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
          await fetch("/roles", {
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
