import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useAppSelector } from "@/app/hooks";
import {
  register as registerUser,
  clearError,
} from "@/features/auth/authSlice";
import { registerSchema } from "@/schemas/auth.schema";
import FormInput from "@/components/common/FormInput";
import { USER_ROLES } from "@/utils/constants";
import { Store, User } from "lucide-react";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: USER_ROLES.CUSTOMER,
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === USER_ROLES.ADMIN
          ? "/admin/dashboard"
          : user.role === USER_ROLES.SELLER
            ? "/seller/dashboard"
            : "/";
      navigate(redirectPath);
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, user, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card max-w-lg w-full p-8 shadow-xl border-(--color-border) bg-(--color-surface)/80 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-(--color-primary) rounded-xl mb-4 shadow-lg shadow-(--color-primary)/20">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h2 className="text-2xl font-bold text-(--color-text-primary)">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Join ApexMart today and start shopping
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-lg bg-(--color-error)/10 border border-(--color-error)/20 text-(--color-error) text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              placeholder="John Doe"
              register={register}
              error={errors.name}
              disabled={loading}
              className="bg-transparent"
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email}
              disabled={loading}
              className="bg-transparent"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="Create password"
                register={register}
                error={errors.password}
                disabled={loading}
                className="bg-transparent"
              />
              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                register={register}
                error={errors.confirmPassword}
                disabled={loading}
                className="bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--color-text-primary) mb-2">
                I want to join as a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue("role", USER_ROLES.CUSTOMER)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    selectedRole === USER_ROLES.CUSTOMER
                      ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary)"
                      : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border-highlight) text-(--color-text-muted)"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedRole === USER_ROLES.CUSTOMER
                        ? "bg-(--color-primary) text-white"
                        : "bg-(--color-background-alt) text-(--color-text-disabled)"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("role", USER_ROLES.SELLER)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    selectedRole === USER_ROLES.SELLER
                      ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary)"
                      : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border-highlight) text-(--color-text-muted)"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedRole === USER_ROLES.SELLER
                        ? "bg-(--color-primary) text-white"
                        : "bg-(--color-background-alt) text-(--color-text-disabled)"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">Seller</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-(--color-primary) border-(--color-border) rounded focus:ring-(--color-primary)"
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-(--color-text-muted)"
            >
              I agree to the{" "}
              <a href="#" className="text-(--color-primary) hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-(--color-primary) hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary flex justify-center py-3 text-sm shadow-lg shadow-(--color-primary)/20 ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-(--color-border) text-center">
          <p className="text-sm text-(--color-text-muted)">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-(--color-primary) hover:text-(--color-primary-hover) transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
