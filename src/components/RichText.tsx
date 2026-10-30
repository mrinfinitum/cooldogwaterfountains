import Image from "next/image";
import Link from "next/link";
import { PortableText, type PortableTextBlock, type PortableTextComponents } from "next-sanity";

type ImageValue = {
  src?: string;
  alt?: string;
  href?: string;
  dimensions?: { width: number; height: number };
};

function ContentImage({ value, sizes }: { value: ImageValue; sizes: string }) {
  if (!value.src) return null;
  const { width = 1200, height = 800 } = value.dimensions ?? {};
  const img = (
    <Image
      src={value.src}
      alt={value.alt ?? ""}
      width={width}
      height={height}
      sizes={sizes}
      className="mx-auto h-auto max-w-full"
    />
  );
  if (!value.href) return img;
  const external = /^https?:\/\//.test(value.href);
  return (
    <a href={value.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {img}
    </a>
  );
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <figure>
        <ContentImage value={value} sizes="(min-width: 1024px) 56rem, 100vw" />
      </figure>
    ),
    imageGrid: ({ value }: { value: { images?: ImageValue[] } }) => (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(value.images ?? []).map((img, i) => (
          <ContentImage key={img.src ?? i} value={img} sizes="(min-width: 640px) 33vw, 50vw" />
        ))}
      </div>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      const className = value?.button ? "wp-button" : undefined;
      if (href.startsWith("/")) {
        return (
          <Link href={href} className={className}>
            {children}
          </Link>
        );
      }
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          className={className}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

/** Renders rich text from Sanity with the site's content styles. */
export default function RichText({
  value,
  className = "",
}: {
  value: PortableTextBlock[];
  className?: string;
}) {
  if (!value?.length) return null;
  return (
    <div className={`wp-content ${className}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
