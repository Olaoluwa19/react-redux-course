import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";

// Adapter for normalization (optional but powerful)
const usersAdapter = createEntityAdapter({
  // Optional: sort users by name for consistent order
  // sortComparer: (a, b) => a.name.localeCompare(b.name),
});
const initialState = usersAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "/users",
      transformResponse: (responseData) => {
        // Normalize array → { ids: [...], entities: {...} }
        return usersAdapter.setAll(initialState, responseData);
      },
      providesTags: (result, error, arg) => [
        { type: "User", id: "LIST" },
        ...result.ids.map((id) => ({ type: "User", id })),
      ],
    }),
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      transformResponse: (responseData) => {
        return usersAdapter.setOne(initialState, responseData);
      },
      providesTags: (result, error, id) => [
        ...result.ids.map((id) => ({ type: "User", id })),
      ],
    }),
  }),
});

export const { useGetUsersQuery, useGetUserByIdQuery } = extendedApiSlice;

//return query result object
export const selectUsersResult = extendedApiSlice.endpoints.getUsers.select();

// create memoized selector
const selectUsersData = createSelector(
  selectUsersResult,
  (usersResult) => usersResult.data ?? initialState, // normalized state object with ids and entities
);

//  getSelectors create these selectors and we rename them with aliases using destructuring
export const { selectAll: selectAllUsers, selectById: selectUserById } =
  usersAdapter.getSelectors((state) => selectUsersData(state));
