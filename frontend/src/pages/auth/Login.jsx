import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useAppSelector } from "@/app/hooks";
import { login, clearError } from "@/features/auth/authSlice";
import { loginSchema } from "@/schemas/auth.schema";
import FormInput from "@/components/common/FormInput";
import { USER_ROLES } from "@/utils/constants";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (from !== "/") {
        navigate(from);
      } else {
        const redirectPath =
          user.role === USER_ROLES.ADMIN
            ? "/admin/dashboard"
            : user.role === USER_ROLES.SELLER
              ? "/seller/dashboard"
              : "/";
        navigate(redirectPath);
      }
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, user, navigate, from, dispatch]);

  const onSubmit = (data) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card max-w-md w-full p-8 shadow-xl border-(--color-border) bg-(--color-surface)/80 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-(--color-primary) rounded-xl mb-4 shadow-lg shadow-(--color-primary)/20">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h2 className="text-2xl font-bold text-(--color-text-primary)">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Sign in to continue to ApexMart
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
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email}
              disabled={loading}
              className="bg-transparent"
            />

            <div>
              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                register={register}
                error={errors.password}
                disabled={loading}
                className="bg-transparent"
              />
              <div className="flex justify-end mt-1">
                <a
                  href="#"
                  className="text-xs font-medium text-(--color-primary) hover:text-(--color-primary-hover) transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary flex justify-center py-3 text-sm shadow-lg shadow-(--color-primary)/20 ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-(--color-border) text-center">
          <p className="text-sm text-(--color-text-muted)">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-(--color-primary) hover:text-(--color-primary-hover) transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
