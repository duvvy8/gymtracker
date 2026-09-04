import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countBodyWeights, countFoodLogs, countFoods } from '../db/queries';
import { DATABASE_NAME } from '../db/schema';
import { Card, CardHeader, LinkButton, PageHeader } from '../components/ui';
import { buttonClasses } from '../lib/buttonStyles';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-5 first:border-t-0 sm:px-5">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-2 max-w-(--container-measure) space-y-3 text-sm text-ink-2">
        {children}
      </div>
    </section>
  );
}

export function PrivacyPage() {
  const counts = useLiveQuery(
    async () => ({
      foods: await countFoods(),
      foodLogs: await countFoodLogs(),
      bodyWeights: await countBodyWeights(),
    }),
    [],
  );

  return (
    <>
      <PageHeader
        title="Privacy"
        description="What this app stores, where it stores it, and the one thing that leaves your device."
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader title="What is stored" description="All of it on this device" />

          <Section title="What you enter">
            <p>
              Foods you save, every entry in your food log, your body weight readings, and your
              daily calorie and macro targets. That is the complete list. There is nothing else.
            </p>
            <p className="numeric">
              Right now this browser holds {counts?.foods ?? 0} foods, {counts?.foodLogs ?? 0} log
              entries and {counts?.bodyWeights ?? 0} weight readings.
            </p>
          </Section>

          <Section title="Where it is stored">
            <p>
              In an IndexedDB database called <span className="numeric">{DATABASE_NAME}</span>,
              inside this browser profile on this device. There is no account, no server, and no
              copy anywhere else. If you open this app in a different browser, or on a different
              computer, it will be empty.
            </p>
          </Section>

          <Section title="What is not collected">
            <p>
              No account, no email address, no name, no device identifier, no location. No
              analytics, no tracking pixels, no advertising, no crash reporting, no telemetry of any
              kind. The app loads no third party scripts, fonts or stylesheets: everything it needs
              is bundled and served from the same place as the app itself.
            </p>
          </Section>
        </Card>

        <Card>
          <CardHeader
            title="What leaves your device"
            description="One thing, and only when you ask for it"
          />

          <Section title="Barcode lookups">
            <p>
              When you scan a barcode or type one in, that barcode number is sent to Open Food Facts
              so the product can be looked up. Their servers see the barcode number and, as with any
              web request, your IP address.
            </p>
            <p>
              Nothing else is included. Not your food log, not your weight, not your targets, not an
              identifier for you or this device. The request carries no cookies. If you never scan a
              barcode, this app never contacts anything.
            </p>
            <p>
              The app can only reach that one address. Any request to anywhere else is refused
              before it is made.
            </p>
            {/* A standalone call to action rather than a link inside a
                sentence, so it gets a real target size instead of relying on
                WCAG 2.5.8's inline exception. */}
            <div className="pt-1">
              <a
                href="https://world.openfoodfacts.org/privacy"
                target="_blank"
                rel="noreferrer noopener"
                className={buttonClasses('secondary')}
              >
                Open Food Facts privacy policy
              </a>
            </div>
          </Section>

          <Section title="The camera">
            <p>
              The camera turns on only when you press the button that says so, never when a page
              loads. While it is on, each frame is examined in this browser to see whether it
              contains a barcode, and then discarded. Frames are never saved, never uploaded and
              never sent anywhere.
            </p>
            <p>
              The camera is released as soon as you turn it off, close the scanner, or leave the
              page. If you would rather not use it, the barcode number can be typed in instead.
            </p>
          </Section>
        </Card>

        <Card>
          <CardHeader
            title="What this means in practice"
            description="The honest limits of storing everything locally"
          />

          <Section title="Your data is not encrypted">
            <p>
              IndexedDB stores this data unencrypted in your browser profile. Anyone who can use
              this device while you are logged in, or who can read the browser profile folder, can
              read your food log. This app cannot protect against that, and it does not pretend to.
              If that matters to you, rely on your operating system account password and full disk
              encryption.
            </p>
          </Section>

          <Section title="Clearing browser data deletes everything">
            <p>
              Because there is no server, there is no backup. Clearing site data, running a browser
              cleanup tool, or using private browsing will delete your entire history with no way to
              recover it. Some browsers also evict storage automatically when a device runs low on
              space.
            </p>
            <p>
              Export a backup from Settings from time to time and keep the file somewhere you trust.
            </p>
          </Section>

          <Section title="One person, one device">
            <p>
              There are no accounts and no sharing, so there is also no syncing between devices and
              no protection between people using the same browser profile. Anyone who opens this app
              in this browser sees your log.
            </p>
          </Section>

          <Section title="Deleting your data">
            <p>
              Settings has a button that deletes every food, entry, weight reading and target from
              this browser. It takes effect immediately and cannot be undone. You can also clear
              this site&apos;s data through your browser settings, which has the same effect.
            </p>
            <div className="pt-1">
              <LinkButton to="/settings">Go to Settings</LinkButton>
            </div>
          </Section>
        </Card>
      </div>
    </>
  );
}
