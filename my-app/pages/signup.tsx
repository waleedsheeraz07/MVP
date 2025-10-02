// pages/signup.tsx:
import Head from 'next/head'
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

  const validatePhoneNumber = (phone: string) => {
    // Validates international format: +countrycode followed by digits
    return /^\+\d{1,4}\d{6,14}$/.test(phone);
  };

  const handleNext = () => {
    setError("");

    if (step === 0) {
      if (!firstName.trim()) return setError("First name is required");
      if (!email.trim()) return setError("Email is required");
      if (!validateEmail(email)) return setError("Enter a valid email address");
      if (phone && !validatePhoneNumber(phone)) return setError("Enter a valid phone number with country code (e.g., +96512345678)");
    }

    if (step === 2) {
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
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter your first name"
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your last name"
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                name="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Phone Number
                <span className="text-[#9ca3af] font-normal ml-1">(Optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+96512345678"
                name="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
              />
              {phone && !validatePhoneNumber(phone) && (
                <p className="text-[#8b4513] text-sm mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Format: +countrycode then numbers (e.g., +96512345678)</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="bday"
                  autoComplete="bday"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Gender
                </label>
                <select
                  name="sex"
                  autoComplete="sex"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Address Line 1
              </label>
              <input
                type="text"
                placeholder="Street address, P.O. box, company name"
                name="address-line1"
                autoComplete="address-line1"
                value={address1}
                onChange={e => setAddress1(e.target.value)}
                className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Address Line 2
                <span className="text-[#9ca3af] font-normal ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Apartment, suite, unit, building, floor, etc."
                name="address-line2"
                autoComplete="address-line2"
                value={address2}
                onChange={e => setAddress2(e.target.value)}
                className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  State / Province
                </label>
                <input
                  type="text"
                  placeholder="Enter state or province"
                  name="address-level1"
                  autoComplete="address-level1"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="Enter country"
                  name="country"
                  autoComplete="country"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="XXXXX"
                name="postal-code"
                autoComplete="postal-code"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  name="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 font-medium text-sm"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 font-medium text-sm"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {confirmPassword && confirmPassword !== password && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Passwords do not match</span>
              </div>
            )}
          </>
        );
    }
  };

  const stepTitles = ["Personal Info", "Address", "Security"];

  return (
    <>
      <Head>
        <title>Sign Up | Vintage Marketplace</title>
        <meta name="description" content="Create your account to start buying and selling authentic vintage items." />
      </Head>
      
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#8b4513] rounded-2xl p-3 shadow-lg">
                <img 
                  src="/logo.png"
                  alt="Vintage Marketplace" 
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Join Vintage Marketplace
            </h1>
            <p className="text-lg text-[#5a4436] max-w-md mx-auto">
              Create your account to start buying and selling authentic vintage treasures
            </p>
          </div>

          {/* Signup Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {stepTitles.map((title, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      index <= step 
                        ? "bg-[#8b4513] text-white shadow-lg scale-110" 
                        : "bg-[#f8efe4] text-[#9ca3af]"
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs font-medium mt-2 transition-colors duration-300 ${
                      index <= step ? "text-[#8b4513]" : "text-[#9ca3af]"
                    }`}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative">
                <div className="absolute top-1/2 w-full h-1 bg-[#f8efe4] transform -translate-y-1/2 rounded-full"></div>
                <div 
                  className="absolute top-1/2 h-1 bg-gradient-to-r from-[#8b4513] to-[#b58b5a] transform -translate-y-1/2 rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form Content */}
            <div className="space-y-6">
              {stepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#e6d9c6]">
              {step > 0 ? (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              ) : (
                <div></div> // Empty div for spacing
              )}

              {step < 2 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 cursor-pointer flex items-center space-x-2 ml-auto"
                >
                  <span>Next Step</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || (confirmPassword && confirmPassword !== password)}
                  className="px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer flex items-center space-x-2 ml-auto"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Sign Up</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-6 pt-6 border-t border-[#e6d9c6]">
              <p className="text-[#5a4436]">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-[#8b4513] font-semibold hover:text-[#6b3410] underline transition-colors duration-300"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}