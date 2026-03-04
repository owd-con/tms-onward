import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/services/user/hooks";
import { useOnboarding } from "@/services/onboarding/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";

interface Step2AddUsersProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { usersCreated: number }) => void;
}

interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "dispatcher" | "driver";
}

const Step2AddUsers = ({ onNext, onBack, onSkip, onUpdate }: Step2AddUsersProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [users, setUsers] = useState<UserFormData[]>([
    {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "dispatcher",
    },
  ]);
  const [_isLoading, setIsLoading] = useState(false);

  const { onboardingStep2, onboardingStep2Result } = useOnboarding();
  const { get } = useUser();

  // Fetch existing users when component mounts
  useEffect(() => {
    const fetchExistingUsers = async () => {
      try {
        setIsLoading(true);
        const result = await get({
          page: 1,
          limit: 100,
        });

        if (result?.data) {
          const mappedUsers: UserFormData[] = result.data
            .filter((user: any) => user.role !== "admin")
            .map((user: any) => ({
              id: user.id,
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              password: "",
              confirmPassword: "",
              role: (user.role || "dispatcher") as "dispatcher" | "driver",
            }));

          if (mappedUsers.length > 0) {
            setUsers(mappedUsers);
          } else {
            setUsers([{
              name: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
              role: "dispatcher",
            }]);
          }
        }
      } catch (error) {
        console.log("Failed to fetch existing users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingUsers();
  }, [get]);

  const handleAddUser = () => {
    setUsers([
      ...users,
      {
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "dispatcher",
      },
    ]);
  };

  const handleRemoveUser = (index: number) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const handleUserChange = (index: number, field: keyof UserFormData, value: string | any) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter users that have data
    const validUsers = users.filter(
      (user) => user.name || user.email || user.phone || user.password
    );

    // Skip if no users to create/update
    if (validUsers.length === 0) {
      onUpdate({ usersCreated: 0 });
      onNext();
      return;
    }

    // Prepare batch payload
    const batchPayload = {
      users: validUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        confirm_password: user.confirmPassword,
        role: user.role,
      })),
    };

    // Call batch endpoint
    await onboardingStep2(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep2Result.isSuccess) {
      const validUsersCount = users.filter(u => u.name || u.email || u.phone || u.password).length;
      onUpdate({ usersCreated: validUsersCount });
      onNext();
    }
  }, [onboardingStep2Result.isSuccess]);

  const isSubmitting = onboardingStep2Result.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 md:p-8">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Add Team Members
          </h2>
          <p className="text-base-content/70 text-sm">
            Your admin account has already been created. Optionally, add more team members to
            get started.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-info mt-0.5">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-info text-sm mb-1">
                Admin Account Created
              </div>
              <div className="text-info/80 text-xs">
                Your account is already set up as an admin. You can add more team members now or
                skip this step and add them later.
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-6">
          {users.map((user, index) => (
            <div key={index} className="border border-base-300 rounded-xl p-4 relative">
              {/* Remove Button */}
              {users.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(index)}
                  className="absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors"
                  aria-label="Remove user"
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* User Header */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-base-content">
                  Team Member {index + 1}
                </div>
              </div>

              {/* User Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id={`user-${index}-name`}
                  label="Full Name"
                  placeholder="Enter full name"
                  value={user.name}
                  onChange={(e) => handleUserChange(index, "name", e.target.value)}
                  error={(FormState?.errors as any)?.[`users.${index}.name`]}
                />

                <Input
                  id={`user-${index}-email`}
                  label="Email"
                  type="email"
                  placeholder="Enter email"
                  value={user.email}
                  onChange={(e) => handleUserChange(index, "email", e.target.value)}
                  error={(FormState?.errors as any)?.[`users.${index}.email`]}
                />

                <Input
                  id={`user-${index}-phone`}
                  label="Phone"
                  type="phone"
                  placeholder="08xxxxxxxxxx"
                  value={user.phone}
                  onChange={(e) => handleUserChange(index, "phone", e.target.value)}
                  error={(FormState?.errors as any)?.[`users.${index}.phone`]}
                />

                <Input
                  id={`user-${index}-password`}
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={user.password}
                  onChange={(e) => handleUserChange(index, "password", e.target.value)}
                  error={(FormState?.errors as any)?.[`users.${index}.password`]}
                />

                <Input
                  id={`user-${index}-confirm-password`}
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm password"
                  value={user.confirmPassword}
                  onChange={(e) => handleUserChange(index, "confirmPassword", e.target.value)}
                  error={(FormState?.errors as any)?.[`users.${index}.confirm_password`]}
                />

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <div className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-base-content capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add User Button */}
          <button
            type="button"
            onClick={handleAddUser}
            className="w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus size={18} />
            Add Another Team Member
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-base-200 px-6 md:px-8 py-4 flex justify-between">
        <Button type="button" variant="secondary" styleType="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            styleType="ghost"
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Step2AddUsers;
