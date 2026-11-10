import { requireOwner } from "@/lib/auth";
import { setPaceAction, signOutEverywhereAction } from "../actions";
import { getPace } from "@/lib/learning";
import { TopBar } from "@/components/TopBar";
import { ChangePassphraseForm } from "@/components/ChangePassphraseForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireOwner();
  const pace = await getPace();
  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <header className="page-head">
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p className="lede">Your pace, your passphrase and the devices signed in to Frontier.</p>
        </header>

        <section className="section">
          <div>
            <h2>Daily pace</h2>
            <p className="desc">The most new lessons the Learn button will start in one day. Reviews are never limited.</p>
          </div>
          <div>
            <form action={setPaceAction} className="pace">
              {[1, 2, 3].map((n) => (
                <button key={n} type="submit" name="pace" value={n} className={n === pace ? "seg is-on" : "seg"} aria-pressed={n === pace}>
                  {n} a day
                </button>
              ))}
            </form>
          </div>
        </section>

        <section className="section">
          <div>
            <h2>Passphrase</h2>
            <p className="desc">Changing it signs out every other device.</p>
          </div>
          <div><ChangePassphraseForm /></div>
        </section>

        <section className="section">
          <div>
            <h2>Devices</h2>
            <p className="desc">Sign out of Frontier on every device, including this one.</p>
          </div>
          <form action={signOutEverywhereAction} style={{ alignSelf: "start" }}>
            <button type="submit" className="btn btn-danger">Sign out everywhere</button>
          </form>
        </section>
      </main>
    </div>
  );
}
