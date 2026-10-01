import {
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

export type UserRole =
  | "student"
  | "instructor";

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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState:
  AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice =
  createSlice({
    name: "auth",

    initialState,

    reducers: {
      login: (
        state,
        action: PayloadAction<{
          user: User;
        }>
      ) => {
        state.user =
          action.payload.user;

        state.isAuthenticated =
          true;
      },

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

      logout: (
        state
      ) => {
        state.user = null;
        state.isAuthenticated =
          false;
      },
    },
  });

export const {
  login,
  updateUser,
  logout,
} =
  authSlice.actions;

export default authSlice.reducer;
