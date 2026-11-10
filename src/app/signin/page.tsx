import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { hasAccount, isSignedIn } from "@/lib/auth";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function SignIn() {
  if (!(await hasAccount())) redirect("/signup");
  if (await isSignedIn()) redirect("/");
  return (
    <AuthFrame>
      <div className="card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to Frontier</h1>
        <p className="lede">Type or paste your passphrase. This device stays signed in for 90 days.</p>
        <SignInForm />
      </div>
    </AuthFrame>
  );
}
