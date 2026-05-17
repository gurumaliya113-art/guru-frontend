import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={logout}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>

          {user && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 capitalize">Role: {user.role}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-600">
                  Welcome to Gurutron! Your account has been successfully authenticated.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You can now access quizzes, papers, and track your progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}