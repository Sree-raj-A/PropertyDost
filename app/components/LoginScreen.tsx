"use client";

import {
  SyntheticEvent,
  useState,
} from "react";

type LoginScreenProps = {
  onLogin: (name: string) => void;
};

export default function LoginScreen({
  onLogin,
}: LoginScreenProps) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  function handleLogin(
    event: SyntheticEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanUsername =
      username.trim();

    const cleanPassword =
      password.trim();

    setError("");

    if (!cleanUsername) {
      setError(
        "Please enter your username."
      );
      return;
    }

    if (!cleanPassword) {
      setError(
        "Please enter your password."
      );
      return;
    }

    /*
      This page.tsx already owns the login state.
      Pass the username back to it instead of
      reloading the page.
    */
    onLogin(cleanUsername);
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-white">

      {/* =====================================================
          LEFT IMAGE
      ===================================================== */}

      <section className="relative hidden min-h-screen w-1/2 overflow-hidden lg:block">

        <img
          src="/house-login.png"
          alt="Property"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute left-12 top-10 z-10">
          <h1 className="font-serif text-4xl font-semibold italic tracking-tight text-white">
            PropertyDost
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Intelligent sales management
          </p>
        </div>
      </section>

      {/* =====================================================
          RIGHT LOGIN SIDE
      ===================================================== */}

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden lg:w-1/2">

        {/* Blurred continuation of the same image */}

        <img
          src="/house-login.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-35"
        />

        {/* Image to white gradient */}

        <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/65 to-white/95" />

        {/* Soft haze */}

        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

        {/* =================================================
            LOGIN CONTENT
        ================================================= */}

        <div className="relative z-10 w-full max-w-md px-8">

          {/* Brand */}

          <div className="mb-10">
            <h1 className="font-serif text-4xl font-semibold italic tracking-tight text-zinc-950">
              PropertyDost
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Welcome back
            </p>
          </div>

          {/* Form */}

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >

            {/* Username */}

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-zinc-900"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                autoComplete="username"
                autoFocus
                onChange={(event) => {
                  setUsername(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                className="w-full rounded-xl border border-zinc-300 bg-white/85 px-4 py-3.5 text-zinc-900 shadow-sm outline-none backdrop-blur-sm transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-zinc-900"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                className="w-full rounded-xl border border-zinc-300 bg-white/85 px-4 py-3.5 text-zinc-900 shadow-sm outline-none backdrop-blur-sm transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Error */}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Sign in */}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99]"
            >
              Sign in
            </button>

          </form>
        </div>
      </section>
    </main>
  );
}