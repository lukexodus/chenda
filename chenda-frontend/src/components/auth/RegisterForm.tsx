"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Store, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/store";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validators/authSchemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      type: undefined,
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, acceptTerms, ...registerData } = data;
      
      await register(registerData);

      toast.success("Registration successful!", {
        description: "Welcome to Chenda. Setting up your account...",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed", {
        description:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Must be at least 6 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account Type - Radio Buttons */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I want to:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                  className="space-y-3"
                >
                  {/* Buyer Option */}
                  <div className="flex items-center space-x-3 rounded-lg border border-[var(--fresh-border)] p-3 hover:bg-[var(--fresh-surface)] transition-colors">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <label
                      htmlFor="buyer"
                      className="flex flex-1 cursor-pointer items-start gap-3"
                    >
                      <User className="mt-0.5 h-5 w-5 text-[var(--fresh-primary)]" />
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">Buy Fresh Products</div>
                        <div className="text-xs text-[var(--fresh-text-muted)]">
                          Search for fresh produce near you
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Seller Option */}
                  <div className="flex items-center space-x-3 rounded-lg border border-[var(--fresh-border)] p-3 hover:bg-[var(--fresh-surface)] transition-colors">
                    <RadioGroupItem value="seller" id="seller" />
                    <label
                      htmlFor="seller"
                      className="flex flex-1 cursor-pointer items-start gap-3"
                    >
                      <Store className="mt-0.5 h-5 w-5 text-[var(--fresh-primary)]" />
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">Sell Products</div>
                        <div className="text-xs text-[var(--fresh-text-muted)]">
                          List your fresh produce for sale
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Both Option */}
                  <div className="flex items-center space-x-3 rounded-lg border border-[var(--fresh-border)] p-3 hover:bg-[var(--fresh-surface)] transition-colors">
                    <RadioGroupItem value="both" id="both" />
                    <label
                      htmlFor="both"
                      className="flex flex-1 cursor-pointer items-start gap-3"
                    >
                      <Users className="mt-0.5 h-5 w-5 text-[var(--fresh-primary)]" />
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">Both Buy & Sell</div>
                        <div className="text-xs text-[var(--fresh-text-muted)]">
                          Access all features as buyer and seller
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms & Conditions Checkbox */}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer text-sm font-normal">
                  I accept the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-[var(--fresh-primary)] hover:underline"
                    target="_blank"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-[var(--fresh-primary)] hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        {/* Link to Login */}
        <p className="text-center text-sm text-[var(--fresh-text-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--fresh-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
