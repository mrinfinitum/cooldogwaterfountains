import Link from "next/link";
import PageHero from "@/components/PageHero";

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404 · Page not found" title="This trail ran dry">
        <p className="mt-6 max-w-xl text-lg text-white/85">
          The page you&apos;re looking for has moved or no longer exists.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-light">
            Back Home
          </Link>
          <Link
            href="/shop/"
            className="btn btn-outline hover:!border-white hover:!bg-white hover:!text-ink"
          >
            Shop Fountains
          </Link>
        </div>
      </PageHero>
      <div className="h-24" />
    </>
  );
}
