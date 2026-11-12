import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrainerProfileForm } from "../TrainerProfileForm.jsx";

const mockUpdateUserProfile = vi.fn();
vi.mock("../../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: {
      id: 3,
      firstName: "Alex",
      lastName: "Morgan",
      email: "trainer.alex@gympilot.com",
      phone: "+91-9876543210",
      role: "trainer",
    },
    profile: {
      specialization: "CrossFit & Conditioning",
      experience_years: 5,
      certification: "CSCS",
      bio: "Fitness coach",
      monthly_salary: 45000,
    },
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

const mockShowToast = vi.fn();
vi.mock("../../../hooks/useToast.js", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockGetProfile = vi.fn();
vi.mock("../../../api/userApi.js", () => ({
  userApi: {
    getProfile: () => mockGetProfile(),
  },
}));

const mockUpdateTrainerProfile = vi.fn();
vi.mock("../../../api/trainerApi.js", () => ({
  trainerApi: {
    updateTrainerProfile: (id, payload) =>
      mockUpdateTrainerProfile(id, payload),
  },
}));

describe("TrainerProfileForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asynchronously loads trainer profile and populates fields", async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: {
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        email: "trainer.alex@gympilot.com",
      },
      profile: {
        specialization: "CrossFit & Conditioning",
        experience_years: 5,
        certification: "CSCS Certified",
        bio: "Passionate strength coach",
        monthly_salary: 45000,
      },
      isProfileComplete: true,
    });

    render(<TrainerProfileForm />);

    expect(screen.getByText(/Loading trainer profile.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toHaveValue("Alex");
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue("Morgan");
      expect(screen.getByLabelText(/Specialization/i)).toHaveValue(
        "CrossFit & Conditioning",
      );
      expect(screen.getByLabelText(/Years of Experience/i)).toHaveValue(5);
      expect(
        screen.getByLabelText(/Certifications & Credentials/i),
      ).toHaveValue("CSCS Certified");
      expect(screen.getByLabelText(/Professional Bio/i)).toHaveValue(
        "Passionate strength coach",
      );
    });
  });

  it("submits updated trainer profile successfully and synchronizes AuthContext", async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: {
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        email: "trainer.alex@gympilot.com",
      },
      profile: {
        specialization: "CrossFit",
        experience_years: 5,
        certification: "CSCS",
        bio: "Coach bio",
        monthly_salary: 45000,
      },
      isProfileComplete: true,
    });

    mockUpdateTrainerProfile.mockResolvedValueOnce({
      user: {
        id: 3,
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        role: "trainer",
        isActive: true,
      },
      profile: {
        specialization: "CrossFit & Olympic Lifting",
        experienceYears: 6,
        certification: "CSCS, USAW",
        bio: "Coach bio updated",
      },
      isProfileComplete: true,
      message: "Trainer profile updated successfully",
    });

    render(<TrainerProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Specialization/i)).toHaveValue("CrossFit");
    });

    fireEvent.change(screen.getByLabelText(/Specialization/i), {
      target: { value: "CrossFit & Olympic Lifting" },
    });
    fireEvent.change(screen.getByLabelText(/Years of Experience/i), {
      target: { value: "6" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Profile/i }));

    await waitFor(() => {
      expect(mockUpdateTrainerProfile).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          specialization: "CrossFit & Olympic Lifting",
          experienceYears: 6,
        }),
      );
      expect(mockUpdateUserProfile).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });
  });

  it("allows clearing optional certification and bio fields with empty strings", async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: {
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        email: "trainer.alex@gympilot.com",
      },
      profile: {
        specialization: "CrossFit",
        experience_years: 5,
        certification: "CSCS",
        bio: "Coach bio",
        monthly_salary: 45000,
      },
      isProfileComplete: true,
    });

    mockUpdateTrainerProfile.mockResolvedValueOnce({
      user: {
        id: 3,
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        role: "trainer",
        isActive: true,
      },
      profile: {
        specialization: "CrossFit",
        experienceYears: 5,
        certification: null,
        bio: null,
      },
      isProfileComplete: true,
    });

    render(<TrainerProfileForm />);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Certifications & Credentials/i),
      ).toHaveValue("CSCS");
    });

    fireEvent.change(screen.getByLabelText(/Certifications & Credentials/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/Professional Bio/i), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Profile/i }));

    await waitFor(() => {
      expect(mockUpdateTrainerProfile).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          certification: "",
          bio: "",
        }),
      );
    });
  });

  it("handles update API failure and displays error message", async () => {
    mockGetProfile.mockResolvedValueOnce({
      user: {
        firstName: "Alex",
        lastName: "Morgan",
        phone: "+91-9876543210",
        email: "trainer.alex@gympilot.com",
      },
      profile: { specialization: "CrossFit", experience_years: 5 },
      isProfileComplete: true,
    });

    mockUpdateTrainerProfile.mockRejectedValueOnce({
      message: "Failed to update trainer profile on server.",
    });

    render(<TrainerProfileForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Specialization/i)).toHaveValue("CrossFit");
    });

    fireEvent.change(screen.getByLabelText(/Specialization/i), {
      target: { value: "New Spec" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Profile/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to update trainer profile on server./i),
      ).toBeInTheDocument();
    });
  });
});
