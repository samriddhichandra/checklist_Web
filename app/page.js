import Image from "next/image";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-bg" aria-hidden="true" />
      <div className="landing-grid">
        <section className="landing-card">
          <div className="landing-badge">Required</div>
          <h1 className="landing-title">Trial SOP Checklist</h1>
          <p className="landing-subtitle">RailwayMitra - POC2</p>
          <p className="landing-desc">
            A guided, sectioned checklist with autosave and JSON export for post-trial reporting.
          </p>

          <div className="landing-actions">
            <a className="landing-cta" href="/form">
              Start the form
            </a>
          </div>

        </section>

        <section className="landing-collage" aria-label="Checklist preview collage">
          <div className="collage">
            <CollageImage className="i1" src="/Image.jpeg" alt="Rail inspection setup" priority />
            <CollageImage
              className="i2"
              src="/A_yellow_industrial_rail_inspection_202605081307.jpeg"
              alt="Yellow industrial rail inspection"
              priority
            />
            <CollageImage className="i3" src="/IMG_3879.jpeg" alt="Trial photo 1" />
            <CollageImage className="i4" src="/IMG_3880.jpeg" alt="Trial photo 2" />
            <CollageImage className="i5" src="/shared%20image.jpeg" alt="Shared trial image" />
          </div>
        </section>
      </div>
    </main>
  );
}

function CollageImage({ className, src, alt, priority = false }) {
  return (
    <div className={`collage-frame ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 900px) 92vw, 46vw"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
