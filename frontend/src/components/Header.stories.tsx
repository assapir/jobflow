import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";
import type { User } from "../types/user";

// Mock I18nextProvider wrapper
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { AuthContext } from "../context/AuthContext";

// Mock auth context value
const mockAuthContextValue = {
  user: null,
  profile: null,
  accessToken: null,
  isLoading: false,
  isProfileLoading: false,
  isAuthenticated: false,
  authStatus: { linkedInConfigured: true, devAuthEnabled: true },
  login: async () => {},
  devLogin: async () => {},
  logout: async () => {},
  setAuthFromCallback: async () => {},
  getAccessToken: () => null,
  fetchProfile: async () => {},
  updateProfile: async () => {},
};

const meta = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Story />
        </AuthContext.Provider>
      </I18nextProvider>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser: User = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  profilePicture: "https://i.pravatar.cc/150?u=johndoe",
};

export const Default: Story = {
  args: {
    onAddJob: () => console.log("Add job clicked"),
    onSearchLinkedIn: () => console.log("Search LinkedIn clicked"),
    user: mockUser,
  },
};

export const WithoutProfilePicture: Story = {
  args: {
    onAddJob: () => {},
    onSearchLinkedIn: () => {},
    user: {
      ...mockUser,
      profilePicture: null,
    },
  },
};

export const NoUser: Story = {
  args: {
    onAddJob: () => {},
    onSearchLinkedIn: () => {},
    user: null,
  },
};

export const LongUserName: Story = {
  args: {
    onAddJob: () => {},
    onSearchLinkedIn: () => {},
    user: {
      ...mockUser,
      name: "Alexandra Elizabeth Johnson-Smith",
      email: "alexandra.johnson-smith@longcompanyname.com",
    },
  },
};
