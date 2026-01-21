/* src/services/AuthService.js */

const API_BASE =
    process.env.REACT_APP_API_BASE ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8082" : "");

if (!API_BASE) {
  throw new Error("Missing REACT_APP_API_BASE");
}


function withBase(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export const AuthService = {
  async getExistingRoles() {
    const endpoints = ["/api/roles"];

    for (const path of endpoints) {
      try {
        const res = await fetch(withBase(path), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          mode: "cors",
        });

        if (res.ok) {
          const roles = await res.json();
          console.log(`Available roles from ${path}:`, roles);
          return roles;
        }
        console.info(`Role fetch from ${path} failed with ${res.status}`);
      } catch (err) {
        console.info(`Role fetch from ${path} threw:`, err.message);
        // Continue to next endpoint
      }
    }

    // If all endpoints failed, throw a helpful error
    throw new Error(
        "Failed to fetch roles. Backend unreachable or CORS blocked."
    );
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
          if (errorData)
            errorMsg = errorData.message || JSON.stringify(errorData);
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

  async deleteUser(userId) {
    const res = await fetch(withBase(`/users/${userId}`), {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Failed to delete user ${userId}: ${res.status}`);
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
          if (errorData)
            errorMsg = errorData.message || JSON.stringify(errorData);
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

  async createVet({ userId, firstName, lastName, license, clinicId, role }) {
    const payload = {
      user: { id: userId },
      firstName,
      lastName,
      license: license || null,
      clinic: { id: clinicId },
      role: role || "doctor", // doctor, assistant, or clinic_admin
    };

    const res = await fetch(withBase("/vets"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeader() },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      throw new Error(txt || `Vet creation failed: ${res.status}`);
    }
    return res.json();
  },

  async createVetSchedule({ vetId, weekday, startTime, endTime }) {
    const payload = {
      vetId,
      weekday,
      startTime,
      endTime,
    };

    const res = await fetch(withBase("/vet-schedules"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeader() },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      throw new Error(txt || `Vet schedule creation failed: ${res.status}`);
    }
    return res.json();
  },

  async register({
    username,
    email,
    password,
    role,
    firstName,
    lastName,
    phone,
    license,
    clinicId,
    vetStartTime,
    vetEndTime,
    vetWeekdayEnd,
  }) {
    // Frontend-side guardrails: validate before any network requests
    const licensePattern = /^[A-Z0-9-]{5,20}$/;
    const normalizedLicense = license ? license.trim().toUpperCase() : "";
    const phonePattern = /^[0-9()+\\-\\s]{7,20}$/;
    const errors = [];

    if (!username || !email || !password || !role) {
      errors.push("Username, email, password, and role are required.");
    }
    if (role === "VET") {
      if (!normalizedLicense) {
        errors.push("License number is required for vets.");
      } else if (!licensePattern.test(normalizedLicense)) {
        errors.push(
          "License format is invalid. Use 5-20 characters: A-Z, 0-9, and dashes."
        );
      }
    }
    
    if (role === "PET_OWNER" && phone) {
      if (!phonePattern.test(phone.trim())) {
        errors.push(
          "Phone number is invalid. Use 7-20 digits and common symbols (+, -, space, parentheses)."
        );
      }
    }
    if (errors.length) {
      throw new Error(errors.join(" "));
    }

    let createdUser = null;
    try {
      // First, create the user with the existing role
      createdUser = await this.registerUser({
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
        // Continue: even if automatic login fails, we still attempt to create profile
      }

      // Create role-specific profile
      if (role === "PET_OWNER") {
        await this.createPetOwner({
          userId: createdUser.id,
          firstName,
          lastName,
          phone,
        });
      } else if (role === "VET" || role === "ASSISTANT") {
        // Only create vet profile if clinicId is provided
        // If not provided, user can update profile later
        if (clinicId) {
          const vetProfile = await this.createVet({
            userId: createdUser.id,
            firstName,
            lastName,
            license: normalizedLicense || license || null,
            clinicId,
            role: role === "ASSISTANT" ? "assistant" : "doctor",
          });

          // NOTE: registration no longer creates an initial vet/assistant schedule.
        } else {
          console.warn(
            "Vet/Assistant registered without clinic - can be updated later"
          );
        }
      }

      // CLINIC_ADMIN doesn't need a separate profile - they're linked via Clinic.clinicAdmin

      return createdUser;
    } catch (err) {
      // Cleanup base user if anything in the pipeline fails
      if (createdUser?.id) {
        try {
          await this.deleteUser(createdUser.id);
        } catch (cleanupErr) {
          // Ignore rollback errors (likely due to missing auth); user may need manual cleanup by admin
          console.warn("Failed to rollback user after registration error:", cleanupErr);
        }
      }
      throw err;
    }
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
      // Extract role from JWT token if available
      const claims = (function () {
        try {
          const p = data.token.split(".")[1];
          return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
          return null;
        }
      })();
      const fallbackUser = {
        id: claims?.sub ? parseInt(claims.sub, 10) : null,
        username:
          claims?.username || claims?.email?.split("@")[0] || usernameOrEmail,
        email: claims?.email || usernameOrEmail,
        role: claims?.role || "PET_OWNER", // Extract role from JWT claims
      };
      storage.setItem("current_user", JSON.stringify(fallbackUser));
      sessionStorage.setItem("current_user", JSON.stringify(fallbackUser));
      return { user: fallbackUser, token: data.token };
    }

    // Case: new JWT token response from /api/auth/login ({ token } or accessToken etc.)
    if (data.accessToken) {
      // store as before
      localStorage.setItem("access_token", data.accessToken);
      sessionStorage.setItem("access_token", data.accessToken);
      const claims = (function () {
        try {
          const p = data.accessToken.split(".")[1];
          return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
          return null;
        }
      })();
      const fallbackUser = {
        id: claims?.sub ? parseInt(claims.sub, 10) : null,
        username:
          claims?.username || claims?.email?.split("@")[0] || usernameOrEmail,
        email: claims?.email || usernameOrEmail,
        role: claims?.role || "PET_OWNER", // Extract role from JWT claims
      };
      sessionStorage.setItem("current_user", JSON.stringify(fallbackUser));
      localStorage.setItem("current_user", JSON.stringify(fallbackUser));
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
