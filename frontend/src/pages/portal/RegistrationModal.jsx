import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Phone,
  Mail,
  User,
  Car,
  ArrowLeft,
  MapPin,
  TagIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import {
  FormInput,
  FormTextarea,
  FormButton,
  FormError,
  FormRow,
} from "../../components/layout/Form/forms";
import { FaCar } from "react-icons/fa";

const RegistrationModal = ({ isOpen, onClose, garage }) => {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    vehicleModel: "",
    location: "",
    otp: "",
    requestedService: "",
  });

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/send-otp`,
        {
          email: formData.email,
          garageId: garage._id,
        },
      );

      if (response.data.success) {
        setStep(2);
        setCountdown(30);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children, required, hint, error }) => (
    <label
      className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest mb-1.5 ${error ? "text-red-600" : "text-gray-900"}`}
    >
      {children}
      {required && <span className="text-red-500 font-black ml-0.5">*</span>}
      {hint && (
        <span className="normal-case font-normal text-gray-500 text-[11px] ml-1">
          ({hint})
        </span>
      )}
    </label>
  );

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/register`,
        {
          ...formData,
          garageId: garage._id,
        },
      );

      if (response.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/portal/send-otp`, {
        email: formData.email,
        garageId: garage._id,
      });
      setCountdown(30);
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
          <div>
            <span className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2 block">
              Registration
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {step === 3 ? "Welcome!" : `Join ${garage?.garageName}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
                className="space-y-5"
              >
                <FormRow cols={2} gap="gap-5">
                  <div className="space-y-2">
                    <Label
                      required
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Full Name
                    </Label>
                    <FormInput
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      leftIcon={<User className="w-5 h-5 text-slate-400" />}
                      inputClassName="pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      required
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Email Address
                    </Label>
                    <FormInput
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
                      inputClassName="pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                </FormRow>

                <FormRow cols={2} gap="gap-5">
                  <div className="space-y-2">
                    <Label
                      required
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Phone Number
                    </Label>
                    <FormInput
                      required
                      name="phone"
                      value={formData.phone}
                      placeholder="+91 1234567890"
                      maxLength={14}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!value.startsWith("+91")) {
                          value = "+91 ";
                        }
                        let digits = value
                          .replace("+91", "")
                          .replace(/\D/g, "");
                        digits = digits.slice(0, 10);
                        value = "+91 " + digits;
                        handleInputChange({
                          target: { name: "phone", value },
                        });
                      }}
                      leftIcon={<Phone className="w-5 h-5 text-slate-400" />}
                      inputClassName="pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      required
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Location / Area
                    </Label>
                    <FormInput
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      leftIcon={<MapPin className="w-5 h-5 text-slate-400" />}
                      inputClassName="pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                </FormRow>

                <FormRow cols={2} gap="gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">
                      Vehicle Number
                    </label>
                    <FormInput
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      placeholder="GJ01AA0000"
                      maxLength={10}
                      onChange={(e) => {
                        let value = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "");

                        let formattedValue = "";
                        for (let i = 0; i < value.length; i++) {
                          const char = value[i];
                          if (i === 0 || i === 1 || i === 4 || i === 5) {
                            if (/[A-Z]/.test(char)) formattedValue += char;
                          } else {
                            if (/[0-9]/.test(char)) formattedValue += char;
                          }
                        }

                        handleInputChange({
                          target: {
                            name: "vehicleNumber",
                            value: formattedValue,
                          },
                        });
                      }}
                      leftIcon={<TagIcon className="w-5 h-5 text-slate-400" />}
                      inputClassName="w-full uppercase pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-base font-semibold tracking-wider"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">
                      Vehicle Model
                    </label>
                    <FormInput
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      placeholder="Toyota Camry"
                      leftIcon={<FaCar className="w-5 h-5 text-slate-400" />}
                      inputClassName="w-full capitalize pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                </FormRow>

                <FormRow cols={2} gap="gap-5">
                  <div className="space-y-2">
                    <Label
                      required
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Complaint
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <FormTextarea
                        required
                        name="requestedService"
                        value={formData.requestedService}
                        onChange={handleInputChange}
                        placeholder="e.g. Oil leak, brake noise, AC not cooling"
                        textareaClassName="pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </FormRow>

                {error && (
                  <FormError
                    message={error}
                    isBanner
                    className="bg-red-50 text-red-600 rounded-2xl border border-red-100"
                  />
                )}

                <FormButton
                  disabled={loading}
                  type="submit"
                  variant="blue"
                  loading={loading}
                  loadingText=""
                  icon={<Send className="w-5 h-5" />}
                  className="py-5 rounded-3xl font-bold text-lg shadow-xl shadow-blue-200"
                >
                  Send Verification Code
                </FormButton>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyAndRegister}
                className="space-y-6 text-center"
              >
                <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    Verify your email
                  </h4>
                  <p className="text-slate-500">
                    We've sent a 6-digit code to your email address{" "}
                    <span className="font-bold text-slate-900">
                      {formData.email}
                    </span>
                  </p>
                </div>

                {/* Adjusted container to contain the medium large styled input nicely */}
                <div className="max-w-sm mx-auto px-4">
                  <FormInput
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    name="otp"
                    value={formData.otp}
                    placeholder="000000"
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, "");
                      handleInputChange({
                        target: { name: "otp", value: cleanValue },
                      });
                    }}
                    // Balanced size and letter spacing to fit beautifully in the input box
                    inputClassName="w-full text-center font-black tracking-[0.6rem] pl-[0.6rem] py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl transition-all outline-none"
                    style={{
                      fontSize: "2.25rem", // Perfectly balanced size between too small and huge
                      lineHeight: "1.2",
                      height: "auto",
                    }}
                  />
                </div>

                {error && (
                  <FormError
                    message={error}
                    isBanner
                    className="bg-red-50 text-red-600 rounded-2xl border border-red-100"
                  />
                )}

                <div className="space-y-4">
                  <FormButton
                    disabled={loading}
                    type="submit"
                    variant="dark"
                    className="py-5 rounded-3xl font-bold text-lg shadow-xl shadow-slate-200"
                  >
                    Verify & Register
                  </FormButton>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleResendOTP}
                      className="text-blue-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {countdown > 0
                        ? `Resend code in ${countdown}s`
                        : "Resend code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Change email address
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="relative mx-auto w-24 h-24">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="absolute inset-0 bg-emerald-100 rounded-full"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900">
                    Your Request Sent Successfully!
                  </h4>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Your request has been sent to{" "}
                    <span className="font-bold text-slate-900">
                      {garage?.garageName}
                    </span>
                    . You'll receive an email once they approve your
                    registration.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-slate-800 transition-all"
                >
                  Got it, Thanks!
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistrationModal;
