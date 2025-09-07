import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = "USER"; // fixed role

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  const validatePhoneNumber = (phone: string) =>
    /^\+\d{1,4}\d{6,14}$/.test(phone);

  const handleNext = () => {
    setError("");

    if (step === 0) {
      if (!firstName.trim()) return setError("First name is required");
      if (!email.trim()) return setError("Email is required");
      if (!validateEmail(email)) return setError("Enter a valid email address");
      if (phone && !validatePhoneNumber(phone))
        return setError(
          "Enter a valid phone number with country code (e.g., +96512345678)"
        );
    }

    if (step === 2) {
      if (!password || !confirmPassword)
        return setError("Both password fields are required");
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
          phoneNumber: phone,
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
        return [
          {
            type: "text",
            placeholder: "First Name *",
            value: firstName,
            onChange: (e: any) => setFirstName(e.target.value),
          },
          {
            type: "text",
            placeholder: "Last Name",
            value: lastName,
            onChange: (e: any) => setLastName(e.target.value),
          },
          {
            type: "email",
            placeholder: "Email Address *",
            value: email,
            onChange: (e: any) => setEmail(e.target.value),
          },
          {
            type: "tel",
            placeholder: "Phone Number (Optional, include country code)",
            value: phone,
            onChange: (e: any) => setPhone(e.target.value),
          },
          {
            type: "date",
            placeholder: "Date of Birth",
            value: dob,
            onChange: (e: any) => setDob(e.target.value),
          },
          {
            type: "select",
            placeholder: "Select Gender",
            value: gender,
            onChange: (e: any) => setGender(e.target.value),
            options: [
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
            ],
          },
        ];
      case 1:
        return [
          { type: "text", placeholder: "Address Line 1", value: address1, onChange: (e: any) => setAddress1(e.target.value) },
          { type: "text", placeholder: "Address Line 2 (Optional)", value: address2, onChange: (e: any) => setAddress2(e.target.value) },
          { type: "text", placeholder: "State", value: state, onChange: (e: any) => setState(e.target.value) },
          { type: "text", placeholder: "Country", value: country, onChange: (e: any) => setCountry(e.target.value) },
          { type: "text", placeholder: "Postal Code", value: postalCode, onChange: (e: any) => setPostalCode(e.target.value) },
        ];
      case 2:
        return [
          {
            type: showPassword ? "text" : "password",
            placeholder: "Password *",
            value: password,
            onChange: (e: any) => setPassword(e.target.value),
            showToggle: true,
            toggleFn: () => setShowPassword(prev => !prev),
          },
          {
            type: showConfirmPassword ? "text" : "password",
            placeholder: "Confirm Password *",
            value: confirmPassword,
            onChange: (e: any) => setConfirmPassword(e.target.value),
            showToggle: true,
            toggleFn: () => setShowConfirmPassword(prev => !prev),
          },
        ];
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="Company Logo" className="h-[34px] w-auto" />
      </div>

      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 w-full h-1 bg-[#d4b996] transform -translate-y-1/2 rounded"></div>
          <div className="flex justify-between relative z-10">
            {[0, 1, 2].map(s => (
              <div key={s} className="flex flex-col items-center w-8">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    s <= step ? "bg-[#3e2f25] text-[#fdf8f3]" : "bg-[#d4b996] text-[#3e2f25]"
                  }`}
                >
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">{error}</p>}

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          {(stepContent() || []).map((field, idx) => (
            field.type === "select" ? (
              <select
                key={idx}
                value={field.value}
                onChange={field.onChange}
                className="input"
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <div key={idx} className="relative">
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={field.onChange}
                  className={`input ${field.showToggle ? "pr-12" : ""}`}
                />
                {field.showToggle && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#3e2f25] hover:text-[#5a4436] transition"
                    onClick={field.toggleFn}
                  >
                    {field.value === password || field.value === confirmPassword
                      ? field.value === password ? (showPassword ? "Hide" : "Show") : (showConfirmPassword ? "Hide" : "Show")
                      : ""}
                  </button>
                )}
              </div>
            )
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-[#d4b996] text-[#3e2f25] rounded-lg hover:bg-[#c4a57e] transition"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || confirmPassword !== password}
              className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
        .input:focus {
          border-color: #3e2f25;
          outline: none;
          box-shadow: 0 0 0 2px rgba(62, 47, 37, 0.2);
        }
      `}</style>
    </div>
  );
}