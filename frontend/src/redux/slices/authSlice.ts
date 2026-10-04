import {
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

// ======================================================
// TYPES
// ======================================================

export type UserRole =
  | "student"
  | "instructor"
  | "admin";

export type AccountStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface TeachingAssignment {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}

export interface User {
  id: string;

  name: string;
  email: string;

  role: UserRole;

  accountStatus:
    AccountStatus;

  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  studentId?: string;
  classSection?: string;

  institution?: string;
  teachingAssignments?: TeachingAssignment[];

  phone?: string;
  city?: string;
  bio?: string;

  profilePicture?: string | null;
}

// ======================================================
// AUTH STATE
// ======================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
}

const initialState:
  AuthState = {
    user: null,
    isAuthenticated: false,
    sessionExpiresAt: null,
  };

// ======================================================
// AUTH SLICE
// ======================================================

const authSlice =
  createSlice({
    name: "auth",

    initialState,

    reducers: {
      // ------------------------------------------------
      // LOGIN
      // ------------------------------------------------

      login: (
        state,
        action: PayloadAction<{
          user: User;
          sessionExpiresAt?: number;
        }>
      ) => {
        state.user =
          action.payload.user;

        state.isAuthenticated =
          true;

        if (action.payload.sessionExpiresAt) {
          state.sessionExpiresAt =
            action.payload.sessionExpiresAt;
        }
      },

      // ------------------------------------------------
      // UPDATE USER
      // ------------------------------------------------

      updateUser: (
        state,
        action: PayloadAction<
          Partial<User>
        >
      ) => {
        if (state.user) {
          state.user = {
            ...state.user,
            ...action.payload,
          };
        }
      },

      // ------------------------------------------------
      // LOGOUT
      // ------------------------------------------------

      logout: (
        state
      ) => {
        state.user = null;

        state.isAuthenticated =
          false;

        state.sessionExpiresAt = null;
      },
    },
  });

// ======================================================
// ACTIONS
// ======================================================

export const {
  login,
  updateUser,
  logout,
} = authSlice.actions;

// ======================================================
// REDUCER
// ======================================================

export default authSlice.reducer;
