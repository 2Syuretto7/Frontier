import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { hasAccount } from "@/lib/auth";
import { SignUpForm } from "@/components/SignUpForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome" };

export default async function SignUp() {
  // Sign-up exists only until the owner's account is created; then it is gone for good.
  if (await hasAccount()) redirect("/signin");
  return (
    <AuthFrame>
      <div className="card">
        <p className="eyebrow">First visit</p>
        <h1>Welcome to Frontier</h1>
        <p className="lede">
          Choose the one passphrase you will use on every device. After this, sign-up closes and only you can enter.
        </p>
        <SignUpForm />
        <p className="foot">Your passphrase is stored only as a one-way Argon2id hash.</p>
      </div>
    </AuthFrame>
  );
}
