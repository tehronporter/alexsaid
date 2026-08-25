import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Download } from "lucide-react";
import styles from "./page.module.css";

import phoneMockup from "./_assets/phone-mockup.jpg";
import monster from "./_assets/hormozi-monster.jpg";
import socialOne from "./_assets/social-quote-progress.jpg";
import socialTwo from "./_assets/social-quote-bloodline.jpg";
import socialThree from "./_assets/social-quote-leverage.jpg";
import socialFour from "./_assets/social-monster-progress.jpg";
import socialFive from "./_assets/social-monster-leverage.jpg";
import socialSix from "./_assets/social-monster-bloodline.jpg";
import merchOne from "./_assets/merch-black-charge-more.jpg";
import merchTwo from "./_assets/merch-purple-bloodline.jpg";
import merchThree from "./_assets/merch-purple-inflated.jpg";
import merchFour from "./_assets/merch-black-progress.jpg";

export const metadata: Metadata = {
  title: { absolute: "Alex Said · A Case Study by Tehron Porter" },
  description: "A daily quote app for Alex Hormozi’s audience, designed, engineered, and shipped by Tehron Porter for Acquisition.com.",
  openGraph: {
    title: "I didn’t just apply. I built something too.",
    description: "A daily quote app for Alex’s audience, designed and built by Tehron Porter.",
    type: "website"
  }
};

const socialPosts: { src: StaticImageData; alt: string }[] = [
  { src: socialFour, alt: "Alex Said social post featuring the purple ACQ monster and a quote about progress" },
  { src: socialOne, alt: "Purple Alex Said quote card about progress and an easy life" },
  { src: socialFive, alt: "Alex Said social post featuring the ACQ monster and a quote about leverage" },
  { src: socialTwo, alt: "Purple Alex Said quote card about changing your bloodline" },
  { src: socialSix, alt: "Alex Said social post featuring the ACQ monster and a quote about what you do next" },
  { src: socialThree, alt: "Purple Alex Said quote card about outleveraging the competition" }
];

const merch: { src: StaticImageData; alt: string }[] = [
  { src: merchOne, alt: "Black Acquisition.com T-shirt mockup with an Alex Hormozi quote" },
  { src: merchTwo, alt: "Purple Acquisition.com T-shirt mockup with an Alex Hormozi quote" },
  { src: merchThree, alt: "Purple Acquisition.com T-shirt mockup reading Artificially Inflated" },
  { src: merchFour, alt: "Black Acquisition.com T-shirt mockup with a quote about progress" }
];

const capabilities = [
  ["01", "Straight from the source", "Every quote is pulled from Alex’s own content and links back to the episode, video, or post it came from."],
  ["02", "Built to be a daily habit", "Install it to the home screen, get an idea each day, save the ones that land, and share them in one tap."],
  ["03", "Designed and engineered by one person", "Brand, interface, content pipeline, and code. I used AI tools the same way I would use them on your team."],
];

function CaseStudyHeader() {
  return (
    <header className={styles.header}>
      <Link href="#top" className={styles.wordmark} aria-label="Alex Said case study, back to top">
        <span className={styles.wordmarkIcon} aria-hidden="true">AS</span>
        <span>ALEX SAID</span>
      </Link>
      <nav className={styles.nav} aria-label="Case study navigation">
        <a href="#product">The product</a>
        <a href="#contact">Contact</a>
      </nav>
      <Link href="/app" className={styles.headerCta}>
        Open the app <ArrowUpRight aria-hidden="true" />
      </Link>
    </header>
  );
}

export default function HomePage() {
  return (
    <main id="top" className={styles.page}>
      <CaseStudyHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>A product + brand case study</p>
          <h1 id="hero-title">I didn’t just apply.<br />I built<br />something too.</h1>
          <p className={styles.heroIntro}>
            Alex Said is a daily quote app for Alex’s audience. Every quote comes straight from his own content. I designed it, engineered it, and shipped it.
          </p>
          <div className={styles.heroActions}>
            <Link href="/app" className={styles.primaryButton}>
              View the live app <ArrowUpRight aria-hidden="true" />
            </Link>
            <a href="#product" className={styles.textLink}>
              Explore the case study <ArrowDown aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroStamp}>Designed + built<br />in Las Vegas</div>
          <Image
            src={phoneMockup}
            alt="Two iPhones showing the Alex Said quote feed and searchable topic library"
            priority
            placeholder="blur"
            sizes="(max-width: 800px) 92vw, 52vw"
            className={styles.phoneImage}
          />
        </div>
        <div className={styles.heroFooter}>
          <span>Tehron Porter</span>
          <span>Designer + Creative Technologist</span>
          <span>2026</span>
        </div>
      </section>

      <section id="product" className={styles.productSection} aria-labelledby="product-title">
        <div className={styles.sectionNumber}>01 / The product</div>
        <div className={styles.productHeading}>
          <p className={styles.eyebrow}>What it is</p>
          <h2 id="product-title">One idea a day<br />in Alex’s own words.</h2>
          <p>
            People keep affirmation apps on their home screen and open them every morning. This does the same job with Alex’s own words. Every quote is pulled directly from his podcasts, videos, and posts, and every one links back to where it came from.
          </p>
        </div>
        <div className={styles.capabilityGrid}>
          {capabilities.map(([number, title, copy]) => (
            <article key={number} className={styles.capabilityCard}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className={styles.productProof}>
          <div>
            <p className={styles.proofKicker}>The proof is in the product.</p>
            <p>This is not a static prototype. Open it, browse it, save an idea, share it, and install it.</p>
          </div>
          <Link href="/app" className={styles.darkButton}>
            Use Alex Said <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="extensions" className={styles.socialSection} aria-labelledby="social-title">
        <div className={styles.sectionNumber}>02 / Social system</div>
        <div className={styles.splitHeading}>
          <h2 id="social-title">One source.<br />Many surfaces.</h2>
          <p>
            Once the quotes live in one place, the content almost makes itself. Any quote in the app can come out as a finished post, so ACQ Media could run a daily feed without a designer starting from a blank file every morning.
          </p>
        </div>
        <div className={styles.socialGrid}>
          {socialPosts.map((post, index) => (
            <figure key={post.src.src} className={index % 3 === 1 ? styles.socialOffset : undefined}>
              <Image src={post.src} alt={post.alt} placeholder="blur" sizes="(max-width: 700px) 46vw, 28vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.monsterSection} aria-labelledby="monster-title">
        <div className={styles.monsterCopy}>
          <div className={styles.sectionNumber}>03 / Character concept</div>
          <p className={styles.eyebrow}>A familiar face for a bigger audience</p>
          <h2 id="monster-title">Meet the<br />Hormozi Monster.</h2>
          <p>
            A character I drew to show what else this brand could reach for. Simple enough to redraw in any pose, recognizable at thumbnail size, and built to carry a hard lesson to an audience that would never sit through a business lecture. ACQ Kids is one direction. Short form and live events are others.
          </p>
          <div className={styles.conceptTags} aria-label="Potential character applications">
            <span>ACQ Kids</span><span>Social</span><span>Events</span><span>Animation</span>
          </div>
        </div>
        <div className={styles.monsterVisual}>
          <span className={styles.monsterLabel}>Character study / 001</span>
          <Image
            src={monster}
            alt="Purple bearded Hormozi Monster character wearing Acquisition.com apparel"
            placeholder="blur"
            sizes="(max-width: 800px) 92vw, 50vw"
          />
        </div>
      </section>

      <section className={styles.merchSection} aria-labelledby="merch-title">
        <div className={styles.sectionNumber}>04 / Merchandise</div>
        <div className={styles.splitHeading}>
          <h2 id="merch-title">From screen<br />to shelf.</h2>
          <p>
            Version 2.0 of the app. The quotes people save become things they can order without leaving it. Shirts, posters, prints. The catalog is already built, so every quote is a product that never needs a new design brief.
          </p>
        </div>
        <div className={styles.merchGrid}>
          {merch.map((item) => (
            <figure key={item.src.src}>
              <Image src={item.src} alt={item.alt} placeholder="blur" sizes="(max-width: 700px) 92vw, 46vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.briefSection} aria-labelledby="brief-title">
        <div className={styles.sectionNumber}>05 / Built for the brief</div>
        <div className={styles.briefIntro}>
          <p className={styles.eyebrow}>Design that ships</p>
          <h2 id="brief-title">Creative direction<br />meets working software.</h2>
        </div>
        <div className={styles.briefGrid}>
          <article>
            <span>Design</span>
            <h3>A system, not a pile of assets.</h3>
            <p>Brand direction, product interface, social templates, character design, and merchandise, all running off one visual idea.</p>
          </article>
          <article>
            <span>Technology</span>
            <h3>A build, not a presentation.</h3>
            <p>A production web app with a structured content pipeline, reusable components, tests, and a real deployment. AI tools did the heavy lifting. The judgment calls were mine.</p>
          </article>
          <article>
            <span>Execution</span>
            <h3>An idea taken all the way.</h3>
            <p>Concept, art direction, prototyping, content design, implementation, QA, and launch. Owned from the first sketch to the live URL.</p>
          </article>
        </div>
      </section>

      <footer id="contact" className={styles.contact}>
        <p className={styles.eyebrow}>Tehron Porter / Las Vegas, NV</p>
        <h2>Let’s build what<br />people remember.</h2>
        <div className={styles.contactLinks}>
          <a href="mailto:tehronporter@gmail.com">tehronporter@gmail.com <ArrowUpRight aria-hidden="true" /></a>
          <a href="tel:+18082123394">808.212.3394 <ArrowUpRight aria-hidden="true" /></a>
          <a href="https://tehron.vercel.app" target="_blank" rel="noreferrer">View full portfolio <ArrowUpRight aria-hidden="true" /></a>
          <a href="/tehron-porter-resume.pdf" target="_blank" rel="noreferrer">Download resume <Download aria-hidden="true" /></a>
        </div>
        <div className={styles.footerLine}>
          <span>Designer + Creative Technologist</span>
          <span>Independent concept for Acquisition.com</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
