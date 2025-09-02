import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type Role = "buyer" | "seller";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState<Role | "">("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  const handleNext = () => {
    setError("");
    if (step === 0 && !role) return setError("Please select a role to continue");
    if (step === 1) {
      if (!firstName.trim()) return setError("First name is required");
      if (!email.trim()) return setError("Email is required");
      if (!validateEmail(email)) return setError("Enter a valid email address");
    }
    if (step === 3) {
      if (!password || !confirmPassword) return setError("Both password fields are required");
      if (password !== confirmPassword) return setError("Passwords do not match");
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName,
          lastName,
          email,
          dob,
          gender,
          address1,
          address2,
          state,
          country,
          postalCode,
          password,
        }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw data;
      router.push("/login");
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "error" in err) {
        setError((err as { error?: string }).error || "Signup failed, try again");
      } else {
        setError("Signup failed, try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-4">
            <p className="text-center font-semibold mb-2">Sign up as:</p>
            <div className="flex gap-4 justify-center">
              {(["buyer", "seller"] as Role[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-6 py-2 rounded-lg font-semibold border ${
                    role === r ? "bg-[#3e2f25] text-[#fdf8f3]" : "border-[#ccc]"
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <>
            <input
              type="text"
              placeholder="First Name *"
              name="given-name"
              autoComplete="given-name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Last Name"
              name="family-name"
              autoComplete="family-name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="Email Address *"
              name="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
            />
            <div className="relative">
              <input
                type="date"
                name="bday"
                autoComplete="bday"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="input peer"
              />
              {!dob && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  Date of Birth
                </span>
              )}
            </div>
            <select
              name="sex"
              autoComplete="sex"
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="input"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </>
        );
      case 2:
        return (
          <>
            <input
              type="text"
              placeholder="Address Line 1"
              name="address-line1"
              autoComplete="address-line1"
              value={address1}
              onChange={e => setAddress1(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              name="address-line2"
              autoComplete="address-line2"
              value={address2}
              onChange={e => setAddress2(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="State"
              name="address-level1"
              autoComplete="address-level1"
              value={state}
              onChange={e => setState(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Country"
              name="country"
              autoComplete="country"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Postal Code"
              name="postal-code"
              autoComplete="postal-code"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              className="input"
            />
          </>
        );
      case 3:
        return (
          <>
            <input
              type="password"
              placeholder="Password *"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="Confirm Password *"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input"
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 w-full h-1 bg-[#d4b996] transform -translate-y-1/2 rounded"></div>
          <div className="flex justify-between relative z-10">
            {[0,1,2,3].map(s => (
              <div key={s} className="flex flex-col items-center w-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${s <= step ? "bg-[#3e2f25] text-[#fdf8f3]" : "bg-[#d4b996] text-[#3e2f25]"}`}>
                  {s === 0 ? "R" : s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">{error}</p>}

        <div className="flex flex-col gap-4">{stepContent()}</div>

        <div className="flex justify-between mt-6">
          {step > 0 && (
            <button onClick={handlePrev} className="px-4 py-2 bg-[#d4b996] text-[#3e2f25] rounded-lg hover:bg-[#c4a57e] transition">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext} className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition ml-auto">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition ml-auto">
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          )}
        </div>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3e2f25] font-semibold underline">
            Login
          </Link>
        </p>
      </div>

      <style jsx>{`
        .input {
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #ccc;
          width: 100%;
          background-color: #fff;
          color: #000;
        }
        .peer:focus + span,
        .peer:not(:placeholder-shown) + span {
          display: none;
        }
      `}</style>
    </div>
  );
}