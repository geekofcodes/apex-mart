import { useAppSelector } from "@/app/hooks";
import { User, Mail, Shield, Calendar, Clock, MapPin } from "lucide-react";
import { formatDate } from "@/utils/helpers";

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="container-custom py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-(--color-text-primary) mb-8">
          My Profile
        </h1>

        {/* Header Card */}
        <div className="card p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          {/* Decorative Background Blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-(--color-primary-light) opacity-20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="w-24 h-24 md:w-32 md:h-32 bg-linear-to-br from-(--color-primary) to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl shrink-0 border-4 border-(--color-surface)">
            {user.name?.charAt(0) || "U"}
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-between mb-2">
              <h2 className="text-3xl font-bold text-(--color-text-primary)">
                {user.name}
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-(--color-info-light) text-(--color-info-dark) border border-(--color-info-light) self-center md:self-auto">
                {user.role} Account
              </span>
            </div>
            <p className="text-(--color-text-muted) text-lg mb-6">
              {user.email}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-(--color-text-muted)">
              <div className="flex items-center gap-1.5 bg-(--color-background) px-3 py-1.5 rounded-lg border border-(--color-border)">
                <Calendar className="w-4 h-4 text-(--color-primary)" />
                <span>Member since {formatDate(new Date())}</span>{" "}
                {/* Mock date since userDTO might not have createdAt */}
              </div>
              <div className="flex items-center gap-1.5 bg-(--color-background) px-3 py-1.5 rounded-lg border border-(--color-border)">
                <MapPin className="w-4 h-4 text-(--color-primary)" />
                <span>United States</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 h-full">
            <h3 className="font-bold text-lg text-(--color-text-primary) mb-6 border-b border-(--color-border) pb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-(--color-primary)" />
              Personal Information
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide">
                  Full Name
                </label>
                <p className="text-base font-medium text-(--color-text-primary) mt-1">
                  {user.name}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-base font-medium text-(--color-text-primary) mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 h-full">
            <h3 className="font-bold text-lg text-(--color-text-primary) mb-6 border-b border-(--color-border) pb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-(--color-accent)" />
              Account Data
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide">
                  Account Status
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-(--color-success)"></span>
                  <span className="text-base font-medium text-(--color-text-primary)">
                    Active
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide">
                  Role
                </label>
                <p className="text-base font-medium text-(--color-text-primary) mt-1 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
