export type SeoProps = {
  title?: string;
  description?: string;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  socialImage?: string;
};

type SeoOptions = {
  props: SeoProps;
  currentUrl: URL;
  configuredSite?: URL;
  isDev: boolean;
};

export const SITE_NAME = "Jafu.py";
export const SITE_AUTHOR = "Jacob";
export const SITE_URL = new URL("https://jafupy.com");
export const DEFAULT_DESCRIPTION =
  "Personal site of Jacob: writing, software projects, experiments, and notes from southern England.";
export const DEFAULT_SOCIAL_IMAGE = "/ogp.png";

const ogImages = new Set(
  Object.keys(import.meta.glob("../../public/og/**/*.png", { eager: true })).map(
    (path) => path.replace("../../public", ""),
  ),
);

export function buildSeoMetadata({
  configuredSite,
  currentUrl,
  isDev,
  props,
}: SeoOptions) {
  const {
    description = DEFAULT_DESCRIPTION,
    modifiedTime,
    ogType = "website",
    publishedTime,
    socialImage: providedSocialImage,
    title = SITE_NAME,
  } = props;

  const site = isDev ? new URL(currentUrl.origin) : (configuredSite ?? SITE_URL);
  const canonical = new URL(currentUrl.pathname, site);
  const match = currentUrl.pathname.match(/^\/writing\/(\d{4})\/([^/]+)\/?$/);
  const inferred = match ? `/og/writing/${match[1]}/${match[2]}.png` : null;
  const imagePath = providedSocialImage
    ? providedSocialImage
    : inferred && ogImages.has(inferred)
      ? inferred
      : DEFAULT_SOCIAL_IMAGE;
  const socialImage = new URL(imagePath, site);
  const pageTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const person = {
    "@type": "Person",
    name: SITE_AUTHOR,
    url: site.toString(),
  };
  const jsonLd =
    ogType === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          url: canonical.toString(),
          image: socialImage.toString(),
          datePublished: publishedTime,
          dateModified: modifiedTime ?? publishedTime,
          author: person,
          publisher: person,
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: site.toString(),
          description,
          author: person,
        };

  return {
    canonical,
    description,
    jsonLd,
    modifiedTime,
    ogType,
    pageTitle,
    publishedTime,
    socialImage,
    title,
  };
}
