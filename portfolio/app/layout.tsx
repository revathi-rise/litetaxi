import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://revathi.tech'),
  title: {
    default: 'Revathi K. | Technical Lead & Full-Stack Architect',
    template: '%s | Revathi K.',
  },
  description:
    'Senior Technical Lead & Full-Stack Architect with 10+ years of proven delivery across enterprise ERP, high-concurrency video streaming, recruitment platforms, and modern web architectures. Specialist in PHP (Laravel, Yii2, CodeIgniter), Next.js, React, Node.js, and relational database systems.',
  applicationName: 'Revathi K. Portfolio',
  authors: [{ name: 'Revathi K.', url: 'https://revathi.tech' }],
  generator: 'Next.js',
  keywords: [
    'Revathi K',
    'revathi.tech',
    'Technical Lead',
    'Full-Stack Architect',
    'Senior Web Developer',
    'PHP Laravel Expert',
    'CodeIgniter',
    'Yii2 Framework',
    'Next.js Developer',
    'React.js Developer',
    'Node.js Architect',
    'NestJS',
    'Enterprise ERP Architect',
    'MySQL',
    'PostgreSQL',
    'Web Application Architecture',
    'Software Engineering Leadership',
    'Chennai Tech Lead',
    'LiteSpark',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Revathi K.',
  publisher: 'Revathi K.',
  alternates: {
    canonical: 'https://revathi.tech',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    type: 'profile',
    firstName: 'Revathi',
    lastName: 'K',
    username: 'revathi-rise',
    gender: 'female',
    locale: 'en_US',
    url: 'https://revathi.tech',
    siteName: 'Revathi K. Portfolio',
    title: 'Revathi K. | Technical Lead & Full-Stack Architect',
    description:
      'Senior Technical Lead & Full-Stack Architect with 10+ years of proven delivery across enterprise ERP, video streaming, recruitment platforms, and scalable web solutions.',
    images: [
      {
        url: '/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'Revathi K. - Technical Lead & Full-Stack Architect',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revathi K. | Technical Lead & Full-Stack Architect',
    description:
      '10+ years driving web application development, developer mentorship, QA coordination, and client delivery.',
    images: ['/profile.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://revathi.tech/#person',
      name: 'Revathi K.',
      alternateName: 'Revathi',
      jobTitle: 'Technical Lead & Full-Stack Architect',
      description:
        'Senior Technical Lead with 10+ years of proven delivery across web application engineering, developer & QA leadership, and scalable platforms in ERP, recruitment, video streaming, and mobility.',
      url: 'https://revathi.tech',
      image: 'https://revathi.tech/profile.jpg',
      email: 'mailto:revathimss7@gmail.com',
      telephone: '+919994157428',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'India',
      },
      sameAs: [
        'https://www.youtube.com/@litespark-r2r/shorts',
        'https://github.com/revathi-rise',
      ],
      knowsAbout: [
        'Full-Stack Web Architecture',
        'Software Engineering Leadership',
        'PHP Frameworks (Laravel, Yii, Yii2, CodeIgniter)',
        'React.js and Next.js',
        'Node.js and NestJS',
        'Enterprise ERP Systems',
        'Relational Database Design (MySQL, PostgreSQL)',
        'RESTful APIs & Microservices',
        'Payment Gateway Integration (Razorpay, Stripe)',
        'Docker & CI/CD Deployment',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://revathi.tech/#website',
      url: 'https://revathi.tech',
      name: 'Revathi K. Portfolio',
      description:
        'Official portfolio and technical projects of Revathi K., Technical Lead & Full-Stack Architect.',
      publisher: {
        '@id': 'https://revathi.tech/#person',
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'ProfilePage',
      '@id': 'https://revathi.tech/#webpage',
      url: 'https://revathi.tech',
      name: 'Revathi K. — Technical Lead & Full-Stack Architect',
      isPartOf: {
        '@id': 'https://revathi.tech/#website',
      },
      about: {
        '@id': 'https://revathi.tech/#person',
      },
      mainEntity: {
        '@id': 'https://revathi.tech/#person',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="font-sans bg-[#07090e] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-white">
        {/* Google Tag Manager / Analytics Tracking */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-TFK7PXZ4"
        />
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

        {/* Structured Data JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
