// src/services/PetOwnerService.js
import { AuthService } from "./AuthService";

export const PetOwnerService = {
  async getPetOwnerByUserId(userId) {
    try {
      // First try the direct endpoint
      const response = await fetch(`/pet-owners/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          ...AuthService.authHeader(),
        },
      });

      if (response.ok) {
        return await response.json();
      }

      // If direct endpoint fails, try getting all and filtering
      const allResponse = await fetch("/pet-owners", {
        headers: {
          "Content-Type": "application/json",
          ...AuthService.authHeader(),
        },
      });

      if (allResponse.ok) {
        const allPetOwners = await allResponse.json();
        return allPetOwners.find((po) => po.id === userId) || null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching pet owner:", error);
      return null;
    }
  },

  async createPetOwner(petOwnerData) {
    try {
      const response = await fetch("/pet-owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AuthService.authHeader(),
        },
        body: JSON.stringify(petOwnerData),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error creating pet owner:", error);
      return null;
    }
  },
};
